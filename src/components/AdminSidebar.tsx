"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Settings, LogOut, Shield, Sparkles, CreditCard, Users, ChevronDown, ChevronRight, BarChart3 } from "lucide-react";
import { useState } from "react";

// Main nav — kept lean: only the things admin uses daily
const mainNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Onboard client", href: "/admin/clients/new", icon: Sparkles, badge: "NEW" },
  { label: "Mandats", href: "/admin/mandates", icon: Briefcase },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Recruteurs", href: "/admin/recruiters", icon: Users },
  { label: "Analytics", href: "/admin/analytics/outreach", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

// Secondary tools — collapsible (less-used, advanced/legacy features)
const advancedNavItems = [
  { label: "Sales pipeline", href: "/admin/sales" },
  { label: "Lead queue", href: "/admin/queue" },
  { label: "Prospects DB", href: "/admin/prospects" },
  { label: "Pilotage", href: "/admin/pilotage" },
  { label: "Réactivation 500+", href: "/admin/reactivation" },
  { label: "Sourcing Apollo (manuel)", href: "/admin/sourcing" },
  { label: "Sourcing Apify (manuel)", href: "/admin/sourcing/apify" },
  { label: "Enrich Apollo", href: "/admin/sourcing/enrich" },
  { label: "New placement", href: "/admin/placements/new" },
  { label: "New candidate (legacy)", href: "/admin/candidates/new" },
  { label: "Admin outreach", href: "/admin/outreach" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <aside className="w-56 bg-zinc-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <Image
          src="/aimio-logo.png"
          alt="Aimio"
          width={100}
          height={28}
          priority
          className="h-7 w-auto"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div className="flex items-center gap-1.5 mt-2">
          <Shield size={10} className="text-zinc-500" />
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-3 space-y-px overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] transition relative",
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

        {/* Advanced (collapsed by default) */}
        <div className="pt-4">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center gap-1.5 px-3 h-7 text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-wider font-semibold transition"
          >
            {advancedOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Outils avancés
          </button>
          {advancedOpen && (
            <div className="mt-1 space-y-px">
              {advancedNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 h-7 rounded-md text-[12px] transition pl-7",
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-400"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 pb-3 border-t border-zinc-800 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] text-zinc-600 hover:text-red-400 hover:bg-zinc-800/50 transition"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
