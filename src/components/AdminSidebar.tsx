"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserPlus, Briefcase, CheckSquare, MessageCircle, Settings, LogOut, Shield, Send, Search, Database, UserCheck, TrendingUp, Flame } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pilotage", href: "/admin/pilotage", icon: TrendingUp },
  { label: "Réactivation 500+", href: "/admin/reactivation", icon: Flame },
  { label: "Sourcing Apollo", href: "/admin/sourcing", icon: Search },
  { label: "Enrich (Apollo)", href: "/admin/sourcing/enrich", icon: UserCheck },
  { label: "Sourcing Apify", href: "/admin/sourcing/apify", icon: Database },
  { label: "New candidate", href: "/admin/candidates/new", icon: UserPlus },
  { label: "Outreach", href: "/admin/outreach", icon: Send },
  { label: "Mandates", href: "/admin/mandates", icon: Briefcase },
  { label: "Approvals", href: "/admin/approvals", icon: CheckSquare, badge: 2 },
  { label: "Client messages", href: "/admin/messages", icon: MessageCircle },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-zinc-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#6C2BD9] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-[10px] tracking-wider">iii</span>
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">Aimio</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 ml-9">
          <Shield size={10} className="text-zinc-500" />
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-px">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] transition-premium relative",
                isActive
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
              {item.badge && (
                <span className="absolute right-2.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold flex items-center justify-center bg-[#6C2BD9] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-3 border-t border-zinc-800 pt-3">
        <div className="px-3 py-2 mb-2">
          <p className="text-[12px] text-zinc-400 font-medium">Alexandre D.</p>
          <p className="text-[10px] text-zinc-600">Gestionnaire IA</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] text-zinc-600 hover:text-red-400 hover:bg-zinc-800/50 transition-premium"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
