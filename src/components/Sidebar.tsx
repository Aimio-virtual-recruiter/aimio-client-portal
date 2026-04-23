"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AimioTeamWidget } from "./AimioTeamWidget";
import { MeetingRequestModal } from "./MeetingRequestModal";
import { LayoutDashboard, Briefcase, BarChart3, LogOut, Building2, TrendingUp, MessageCircle, History, Bell, Calendar, Plus } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  const navItems = [
    { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.mandates"), href: "/mandats", icon: Briefcase },
    { label: t("nav.analytics"), href: "/analytics", icon: TrendingUp },
    { label: t("nav.reports"), href: "/rapports", icon: BarChart3 },
    { label: t("nav.messages"), href: "/messages", icon: MessageCircle, badge: 2 },
    { label: t("nav.history"), href: "/historique", icon: History },
  ];

  return (
    <aside className="w-56 bg-white border-r border-zinc-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <Image src="/aimio-logo.png" alt="Aimio" width={100} height={28} priority className="h-7 w-auto" />
        <p className="label mt-2">{t("common.portalName")}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-px">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] transition-premium relative",
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
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

      {/* Quick actions */}
      <div className="px-3 mb-3 space-y-1.5">
        <Link
          href="/mandats/nouveau"
          className="flex items-center gap-2 px-3 py-2.5 bg-[#6C2BD9] hover:bg-[#5521B5] text-white rounded-lg text-[12px] font-semibold transition-premium btn-press"
        >
          <Plus size={14} />
          Nouveau mandat
        </Link>
        <button
          onClick={() => setMeetingModalOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-[12px] font-medium transition-premium"
        >
          <Calendar size={14} />
          Demander rencontre
        </button>
      </div>

      {/* Aimio Team Widget */}
      <div className="px-3 mb-3">
        <AimioTeamWidget compact />
      </div>

      {/* Alert */}
      <div className="px-3 mb-2">
        <div className="bg-[#6C2BD9]/5 rounded-lg p-3 border border-[#6C2BD9]/10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Bell size={12} className="text-[#6C2BD9]" />
            <p className="text-[11px] font-medium text-[#6C2BD9]">{t("nav.newAlert")}</p>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">{t("nav.alertText")}</p>
        </div>
      </div>

      {/* Meeting Request Modal */}
      <MeetingRequestModal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)} />

      {/* Language */}
      <div className="px-3 mb-2">
        <LanguageSwitcher />
      </div>

      {/* Company */}
      <div className="px-3 pb-3">
        <div className="bg-zinc-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 size={13} className="text-zinc-400" />
            <p className="text-[13px] font-medium text-zinc-900">Construction Lemieux</p>
          </div>
          <p className="text-[11px] text-zinc-400 ml-[21px]">Plan Pro - 5 postes</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-3 border-t border-zinc-100 pt-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-premium"
        >
          <LogOut size={15} strokeWidth={1.5} />
          {t("common.logout")}
        </Link>
      </div>
    </aside>
  );
}
