"use client";
import { useEffect, useState, useRef } from "react";
import { getMessages, sendMessage, subscribeToMessages, type Message } from "@/lib/supabase";
import { useI18n } from "@/i18n/provider";
import { Send, Loader2 } from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      const data = await getMessages();
      setMessages(data);
      setLoading(false);
    }
    load();

    const channel = subscribeToMessages((msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(newMessage, "Sarah Mitchell");
      setNewMessage("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;

  return (
    <div className="max-w-3xl h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{t("nav.messages")}</h1>
        <p className="text-zinc-400 text-[13px] mt-0.5">Chat with your Aimio account manager</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6C2BD9]/10 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-semibold text-[#6C2BD9]">A</span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-900">Alex — Aimio Account Manager</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] text-zinc-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.sender_type === "client"
                ? "bg-zinc-900 text-white rounded-2xl rounded-br-md"
                : "bg-zinc-100 text-zinc-900 rounded-2xl rounded-bl-md"
              } px-4 py-3`}>
                {msg.sender_type === "aimio" && (
                  <p className="text-[10px] text-[#6C2BD9] font-medium mb-1">{msg.sender_name}</p>
                )}
                <p className="text-[13px] leading-relaxed">{msg.content}</p>
                <p className={`text-[9px] mt-1.5 ${msg.sender_type === "client" ? "text-zinc-400" : "text-zinc-400"}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-100">
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-4 py-2.5 bg-zinc-50 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/10 focus:bg-white border border-zinc-100 focus:border-[#6C2BD9]/30 placeholder:text-zinc-300"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl flex items-center justify-center disabled:opacity-30 btn-press shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-[9px] text-zinc-300 mt-2 text-center">Press Enter to send</p>
        </div>
      </div>
    </div>
  );
}
