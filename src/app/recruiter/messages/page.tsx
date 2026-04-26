"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Loader2,
  ArrowLeft,
  Sparkles,
  Search,
  MessageCircle,
  Users,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ThreadSummary {
  thread_id: string;
  client_id: string;
  client_company_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  recruiter_id: string | null;
  recruiter_first_name: string | null;
  recruiter_last_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_type: string | null;
  client_unread_count: number;
  recruiter_unread_count: number;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: "client" | "recruiter" | "admin" | "ai_system";
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function RecruiterMessagesPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        setRecruiterName(
          `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "You"
        );
      }

      const res = await fetch("/api/messages?list=threads");
      if (!res.ok) throw new Error("Failed to load threads");
      const { threads: data } = await res.json();
      setThreads(data || []);
    } catch (err) {
      console.error("Load threads error:", err);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?thread_id=${threadId}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const { messages: data } = await res.json();
      setMessages(data || []);
      // Refresh threads (unread counts changed)
      loadThreads();
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadThreads]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeThreadId) loadMessages(activeThreadId);
  }, [activeThreadId, loadMessages]);

  // Real-time updates for active thread
  useEffect(() => {
    if (!activeThreadId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`recruiter-msgs:${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadId]);

  // Real-time thread list updates (any new message anywhere)
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("recruiter-threads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_threads" },
        () => {
          loadThreads();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeThread = threads.find((t) => t.thread_id === activeThreadId);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !activeThreadId) return;
    setSending(true);
    const content = newMessage;
    setNewMessage("");

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      thread_id: activeThreadId,
      sender_id: null,
      sender_type: "recruiter",
      sender_name: recruiterName,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: activeThreadId, content }),
      });
      if (!res.ok) throw new Error("Send failed");
      const { message } = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? message : m))
      );
      loadThreads();
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  // Filtered threads
  const filtered = threads.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.client_company_name?.toLowerCase().includes(q) ||
      t.contact_first_name?.toLowerCase().includes(q) ||
      t.contact_last_name?.toLowerCase().includes(q) ||
      t.contact_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <Link
          href="/recruiter"
          className="inline-flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-900 mb-2"
        >
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Client Messages</h1>
            <p className="text-[12px] text-zinc-500">
              {threads.length} active conversation{threads.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          {/* Threads list */}
          <div className="col-span-4 bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-zinc-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full pl-8 pr-3 py-2 text-[12px] border border-zinc-200 rounded-lg focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingThreads ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={16} className="animate-spin text-zinc-300" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle size={24} className="text-zinc-300 mb-2" />
                  <p className="text-[12px] text-zinc-500">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {filtered.map((thread) => {
                    const isActive = thread.thread_id === activeThreadId;
                    const hasUnread = thread.recruiter_unread_count > 0;
                    return (
                      <button
                        key={thread.thread_id}
                        onClick={() => setActiveThreadId(thread.thread_id)}
                        className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition relative ${
                          isActive ? "bg-[#2445EB]/5 border-l-2 border-[#2445EB]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[13px] font-bold text-zinc-900 truncate">
                            {thread.client_company_name || "Unknown"}
                          </p>
                          {hasUnread && (
                            <span className="bg-[#2445EB] text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                              {thread.recruiter_unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {thread.contact_first_name} {thread.contact_last_name}
                        </p>
                        {thread.last_message_preview && (
                          <p className="text-[11px] text-zinc-400 truncate mt-1">
                            {thread.last_message_sender_type === "client" ? "" : "You: "}
                            {thread.last_message_preview}
                          </p>
                        )}
                        {thread.last_message_at && (
                          <p className="text-[10px] text-zinc-400 mt-1">
                            {new Date(thread.last_message_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Conversation panel */}
          <div className="col-span-8 bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
            {!activeThread ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Users size={36} className="text-zinc-300 mb-3" />
                <p className="text-[14px] font-semibold text-zinc-900 mb-1">
                  Select a conversation
                </p>
                <p className="text-[12px] text-zinc-500 max-w-xs">
                  Choose a client from the left to start chatting.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-100 bg-gradient-to-r from-[#2445EB]/5 to-[#4B5DF5]/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-zinc-700 flex items-center justify-center font-bold text-[14px]">
                    {(activeThread.client_company_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-zinc-900">
                      {activeThread.client_company_name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {activeThread.contact_first_name} {activeThread.contact_last_name} · {activeThread.contact_email}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4 bg-zinc-50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 size={20} className="animate-spin text-zinc-300" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <RecruiterMessageBubble
                          key={msg.id}
                          message={msg}
                          recruiterName={recruiterName}
                        />
                      ))}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="px-5 py-3 border-t border-zinc-100 bg-white">
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
                      placeholder={`Reply to ${activeThread.client_company_name}...`}
                      rows={2}
                      className="flex-1 px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none resize-none"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecruiterMessageBubble({
  message,
  recruiterName,
}: {
  message: Message;
  recruiterName: string;
}) {
  const isMe = message.sender_type === "recruiter" || message.sender_type === "admin";
  const isAI = message.sender_type === "ai_system";
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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
          </div>
          <p className="text-[13px] text-zinc-700 leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        {!isMe && (
          <p className="text-[10px] text-zinc-500 mb-1 px-1">
            {message.sender_name} · {time}
          </p>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isMe
              ? "bg-[#2445EB] text-white rounded-br-md"
              : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-md shadow-sm"
          }`}
        >
          <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.content}</p>
        </div>
        {isMe && (
          <p className="text-[10px] text-zinc-400 mt-1 px-1">
            {recruiterName} · {time}
          </p>
        )}
      </div>
    </div>
  );
}
