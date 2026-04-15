"use client";
import { useI18n } from "@/i18n/provider";
import { locales, localeNames, Locale } from "@/i18n/config";
import { useState } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 transition-premium text-[12px] text-zinc-500"
      >
        <Globe size={13} />
        <span>{localeNames[locale]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg border border-zinc-200 shadow-elevated overflow-hidden z-50 min-w-[140px]">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc as Locale);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-zinc-50 transition-premium ${
                  locale === loc ? "text-[#6C2BD9] font-medium bg-[#6C2BD9]/[0.03]" : "text-zinc-600"
                }`}
              >
                {localeNames[loc as Locale]}
                {locale === loc && <div className="w-1 h-1 bg-[#6C2BD9] rounded-full ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
