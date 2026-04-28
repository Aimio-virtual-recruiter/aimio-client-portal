"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  LogOut,
  MessageCircle,
  Plus,
  Sparkles,
  GitBranch,
  FileText,
  Loader2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserContext {
  email: string;
  firstName: string;
  companyName: string;
  plan: string;
  daysActive: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newCandidates, setNewCandidates] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, client_company_id")
            .eq("id", authUser.id)
            .single();

          let companyName = "Your Company";
          let plan = "Growth";
          let daysActive = 0;

          if (profile?.client_company_id) {
            const { data: client } = await supabase
              .from("clients")
              .select("company_name, plan, billing_start_date")
              .eq("id", profile.client_company_id)
              .single();
            if (client) {
              companyName = client.company_name;
              plan = client.plan || "Growth";
              if (client.billing_start_date) {
                const start = new Date(client.billing_start_date);
                daysActive = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
              }
            }
          }

          setUser({
            email: authUser.email || "",
            firstName: profile?.first_name || "there",
            companyName,
            plan,
            daysActive,
          });

          setUnreadMessages(2);
          setNewCandidates(3);
        }
      } catch (err) {
        console.error("Sidebar init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Stripped to 4 essentials. The base flow: see dashboard → manage mandates →
  // review delivered candidates → chat with recruiter. Everything else is hidden.
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { label: "Mes mandats", href: "/mandats", icon: Briefcase, badge: 0 },
    { label: "Mes candidats", href: "/candidats", icon: Sparkles, badge: newCandidates },
    { label: "Messagerie", href: "/messages", icon: MessageCircle, badge: unreadMessages },
  ];

  return (
    <aside className="w-60 bg-white border-r border-zinc-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-100">
        <Image src="/aimio-logo.png" alt="Aimio" width={100} height={28} priority className="h-7 w-auto" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mt-2">
          Virtual Recruiter
        </p>
      </div>

      {loading ? (
        <div className="mx-3 mt-3 p-3 bg-zinc-50 rounded-lg flex items-center justify-center">
          <Loader2 size={14} className="animate-spin text-zinc-300" />
        </div>
      ) : user ? (
        <div className="mx-3 mt-3 p-3 bg-gradient-to-br from-[#2445EB]/5 to-[#4B5DF5]/5 rounded-lg border border-[#2445EB]/10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-[#2445EB] text-white flex items-center justify-center text-[11px] font-bold">
              {user.firstName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-zinc-900 truncate">{user.firstName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.companyName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
            <span className="bg-[#2445EB]/10 text-[#2445EB] px-1.5 py-0.5 rounded font-semibold">
              {user.plan?.toUpperCase()}
            </span>
            <span>Day {user.daysActive}</span>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 px-3 py-3 space-y-px mt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] transition-all duration-200 relative",
                isActive
                  ? "bg-[#2445EB]/10 text-[#2445EB] font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
              {item.badge > 0 && (
                <span className="absolute right-2.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center bg-[#2445EB] text-white px-1">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mb-3 space-y-1.5">
        <Link
          href="/mandats/nouveau"
          className="flex items-center gap-2 px-3 py-2.5 bg-[#2445EB] hover:bg-[#1A36C4] text-white rounded-lg text-[12px] font-semibold transition-all duration-200 shadow-md shadow-[#2445EB]/20"
        >
          <Plus size={14} />
          New role
        </Link>
        <Link
          href="/messages"
          className="w-full flex items-center gap-2 px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-[12px] font-medium transition-all duration-200"
        >
          <MessageCircle size={14} />
          Ask your recruiter
        </Link>
      </div>

      <div className="px-3 pb-4 border-t border-zinc-100 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded text-[12px] transition-all duration-200"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
