"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ArrowRight, Search, MessageSquare, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-zinc-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#6C2BD9]/20 via-transparent to-[#8B5CF6]/10" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#6C2BD9]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Image
            src="/aimio-logo.png"
            alt="Aimio"
            width={110}
            height={32}
            priority
            className="h-8 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <p className="label text-zinc-500 mt-2">{t("common.subtitle")}</p>
        </div>

        <div className="relative z-10">
          <h1 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-8" dangerouslySetInnerHTML={{ __html: t("dashboard.recruitIntelligently").replace("<span>", '<span class="text-zinc-500">') }} />

          <div className="space-y-3">
            {[
              { icon: Search, text: t("dashboard.step1") },
              { icon: MessageSquare, text: t("dashboard.step2") },
              { icon: UserCheck, text: t("dashboard.step3") },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <step.icon size={14} className="text-zinc-400" />
                </div>
                <span className="text-[13px] text-zinc-400">{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-zinc-600">{t("common.copyright")}</p>
      </div>

      {/* Right — Login */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Image src="/aimio-logo.png" alt="Aimio" width={110} height={32} priority className="h-8 w-auto" />
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">{t("login.title")}</h2>
          <p className="text-[13px] text-zinc-400 mt-1 mb-8">{t("login.subtitle")}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label mb-2 block">{t("login.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium text-[13px] text-zinc-900 placeholder:text-zinc-300"
                required
              />
            </div>
            <div>
              <label className="label mb-2 block">{t("login.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-premium text-[13px] text-zinc-900 placeholder:text-zinc-300"
                required
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-[11px] text-[#6C2BD9] hover:text-[#5521B5] font-medium transition-premium">
                {t("login.forgotPassword")}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition-premium disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 btn-press"
            >
              {loading ? t("login.submitting") : t("login.submit")}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <p className="text-center label mt-8">{t("common.poweredBy")}</p>
        </div>
      </div>
    </div>
  );
}
