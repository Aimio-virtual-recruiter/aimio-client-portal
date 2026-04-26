"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Users,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: "client" | "recruiter" | "admin" | "ai_system";
  sender_name: string;
  content: string;
  ai_event_type: string | null;
  ai_event_data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

interface ThreadSummary {
  thread_id: string;
  recruiter_first_name: string | null;
  recruiter_last_name: string | null;
  recruiter_email: string | null;
  client_company_name: string | null;
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
  const [thread, setThread] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recruiterName, setRecruiterName] = useState("Marc-Antoine");
  const [userName, setUserName] = useState("there");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThreadAndMessages = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, client_company_id")
        .eq("id", user.id)
        .single();
      setUserName(profile?.first_name || "there");

      // Fetch threads (clients have at most 1 thread with their recruiter)
      const threadsRes = await fetch("/api/messages?list=threads");
      if (!threadsRes.ok) {
        setLoading(false);
        return;
      }
      const { threads } = await threadsRes.json();
      const myThread: ThreadSummary | undefined = threads?.[0];

      if (!myThread) {
        // No thread yet — initialize empty
        setLoading(false);
        return;
      }

      setThread(myThread);
      if (myThread.recruiter_first_name) {
        setRecruiterName(
          `${myThread.recruiter_first_name} ${myThread.recruiter_last_name || ""}`.trim()
        );
      }

      // Fetch messages for the thread
      const msgsRes = await fetch(`/api/messages?thread_id=${myThread.thread_id}`);
      if (msgsRes.ok) {
        const { messages: msgs } = await msgsRes.json();
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreadAndMessages();
  }, [loadThreadAndMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!thread?.thread_id) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${thread.thread_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${thread.thread_id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (we may have optimistically added it)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.thread_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content?: string) => {
    const message = content || newMessage;
    if (!message.trim() || sending) return;

    setSending(true);
    setNewMessage("");

    // Optimistic UI
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      thread_id: thread?.thread_id || "pending",
      sender_id: null,
      sender_type: "client",
      sender_name: userName,
      content: message,
      ai_event_type: null,
      ai_event_data: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: thread?.thread_id,
          content: message,
        }),
      });

      if (!res.ok) throw new Error("Send failed");
      const { message: realMsg, thread_id } = await res.json();

      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? realMsg : m))
      );

      // If thread was just created, load it
      if (!thread && thread_id) {
        loadThreadAndMessages();
      }
    } catch (err) {
      console.error("Send error:", err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-1">Messages</h1>
        <p className="text-[13px] text-zinc-500">
          Direct channel with {recruiterName}, your dedicated recruiter
        </p>
      </div>

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
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <MessageCircle size={32} className="text-zinc-300 mb-3" />
              <p className="text-[14px] font-semibold text-zinc-900 mb-1">
                Start the conversation
              </p>
              <p className="text-[12px] text-zinc-500 max-w-xs">
                Ask about candidates, schedule a call, or update your role profile.
                {recruiterName} will respond within 4 hours.
              </p>
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
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 transition"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

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
  const isAI = message.sender_type === "ai_system";

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
