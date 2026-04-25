"use client";
import { useEffect, useState, useRef } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  sender_type: "client" | "aimio" | "ai";
  sender_name: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Schedule a call",
    prompt: "Hi! I'd like to schedule a check-in call this week. What times work for you?",
    icon: <Calendar size={12} />,
  },
  {
    label: "Update role",
    prompt: "I'd like to adjust my role profile. Can we discuss the must-haves and salary range?",
    icon: <Sparkles size={12} />,
  },
  {
    label: "Need more candidates",
    prompt: "Can we increase sourcing volume for my open role? I'd like to see more candidates.",
    icon: <MessageCircle size={12} />,
  },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recruiterName, setRecruiterName] = useState("Marc-Antoine");
  const [userName, setUserName] = useState("there");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, client_company_id")
            .eq("id", user.id)
            .single();

          setUserName(profile?.first_name || "there");

          if (profile?.client_company_id) {
            const { data: client } = await supabase
              .from("clients")
              .select("recruteur_lead")
              .eq("id", profile.client_company_id)
              .single();

            if (client?.recruteur_lead) {
              setRecruiterName(client.recruteur_lead);
            }
          }
        }

        // Demo seed messages (in production: load real messages from DB)
        setMessages([
          {
            id: "1",
            sender_type: "aimio",
            sender_name: "Marc-Antoine",
            content:
              "Welcome aboard! Excited to start sourcing for your Senior SWE role. I'll have your first batch of qualified candidates by Friday.",
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            read_at: new Date().toISOString(),
          },
          {
            id: "2",
            sender_type: "ai",
            sender_name: "Aimio AI",
            content:
              "📊 Quick update: I've sourced 200 candidates from LinkedIn + Apollo, scored them all, and identified 38 strong matches. Marc-Antoine is qualifying the top 8 today.",
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: "3",
            sender_type: "aimio",
            sender_name: "Marc-Antoine",
            content:
              "First batch delivered! Sarah Tremblay (Score 87) is particularly strong — ex-Shopify, exact match for your tech stack. She's available for interviews next week.",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            read_at: null,
          },
        ]);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content?: string) => {
    const message = content || newMessage;
    if (!message.trim()) return;

    setSending(true);
    const newMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_type: "client",
      sender_name: userName,
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");

    // Simulate Marc reply (in production: real backend handles this)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now() + 1}`,
          sender_type: "aimio",
          sender_name: recruiterName,
          content: "Got it! I'll get back to you within a few hours.",
          created_at: new Date().toISOString(),
        },
      ]);
      setSending(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1">Messages</h1>
        <p className="text-[13px] text-zinc-500">
          Direct channel with {recruiterName}, your dedicated recruiter
        </p>
      </div>

      {/* Conversation */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {/* Recruiter header */}
        <div className="px-5 py-4 border-b border-zinc-100 bg-gradient-to-r from-[#2445EB]/5 to-[#4B5DF5]/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2445EB] to-[#4B5DF5] text-white flex items-center justify-center font-bold text-[14px]">
            {recruiterName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-zinc-900">{recruiterName}</p>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Dedicated recruiter · Replies in &lt; 4h</p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-5 py-4 h-[450px] overflow-y-auto space-y-4 bg-zinc-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-zinc-300" />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} userName={userName} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="px-5 py-3 border-t border-zinc-100 bg-white">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Quick:
            </span>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
              disabled={sending}
            />
            <button
              onClick={() => handleSend()}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2.5 bg-[#2445EB] text-white rounded-lg hover:bg-[#1A36C4] disabled:opacity-40 transition flex items-center gap-1.5 text-[12px] font-semibold"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, userName }: { message: Message; userName: string }) {
  const isClient = message.sender_type === "client";
  const isAI = message.sender_type === "ai";
  const isAimio = message.sender_type === "aimio";

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(message.created_at).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  if (isAI) {
    return (
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-[#2445EB]/10 to-[#4B5DF5]/10 border border-[#2445EB]/20 rounded-xl px-4 py-3 max-w-md">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-[#2445EB]" />
            <p className="text-[11px] font-bold text-[#2445EB] uppercase tracking-wider">
              {message.sender_name}
            </p>
            <span className="text-[10px] text-zinc-400">· {date}</span>
          </div>
          <p className="text-[13px] text-zinc-700 leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-md ${isClient ? "items-end" : "items-start"} flex flex-col`}>
        {!isClient && (
          <p className="text-[10px] text-zinc-500 mb-1 px-1">
            {message.sender_name} · {time}
          </p>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isClient
              ? "bg-[#2445EB] text-white rounded-br-md"
              : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-md shadow-sm"
          }`}
        >
          <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.content}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1">
          {isClient && <span className="text-[10px] text-zinc-400">{userName} · {time}</span>}
          {isClient && message.id && !message.id.startsWith("temp-") && (
            <CheckCircle2 size={11} className="text-zinc-300" />
          )}
        </div>
      </div>
    </div>
  );
}
