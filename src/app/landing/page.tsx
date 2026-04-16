"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Search, MessageSquare, UserCheck, BarChart3, Shield, Zap, Globe, Clock, Users, ChevronRight, Sparkles, Play } from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [activeDemo, setActiveDemo] = useState(0);
  const t = lang === "en" ? en : fr;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100/50 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/aimio-logo.png" alt="Aimio" width={90} height={26} />
          <div className="flex items-center gap-8">
            <a href="#how" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.how}</a>
            <a href="#platform" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.platform}</a>
            <a href="#pricing" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.pricing}</a>
            <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="text-[11px] text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-full px-2.5 py-1 transition-all duration-200">
              {lang === "en" ? "FR" : "EN"}
            </button>
            <a href="/" className="px-5 py-2 bg-zinc-900 text-white rounded-full text-[13px] font-medium hover:bg-zinc-800 transition-all duration-200">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — Dark, Apple-style */}
      <section className="relative bg-zinc-950 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#6C2BD9]/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-40 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur border border-white/10 rounded-full mb-8">
            <div className="w-1.5 h-1.5 bg-[#6C2BD9] rounded-full animate-pulse" />
            <span className="text-[12px] text-zinc-400 tracking-wide">{t.hero.badge}</span>
          </div>

          <h1 className="text-[72px] font-bold text-white tracking-tight leading-[0.95] mb-4">
            {t.hero.line1}
          </h1>
          <h2 className="text-[72px] font-bold tracking-tight leading-[0.95] mb-8 bg-gradient-to-r from-[#6C2BD9] via-[#8B5CF6] to-[#A78BFA] bg-clip-text text-transparent">
            {t.hero.line2}
          </h2>

          <p className="text-[18px] text-zinc-400 max-w-xl mx-auto leading-relaxed mb-12">
            {t.hero.subtitle}
          </p>

          <div className="flex items-center justify-center gap-4">
            <a href="#pricing" className="group px-8 py-4 bg-white text-zinc-900 rounded-full text-[15px] font-semibold hover:bg-zinc-100 transition-all duration-200 flex items-center gap-2">
              {t.hero.cta}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#platform" className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full text-[15px] font-medium hover:bg-white/10 transition-all duration-200 flex items-center gap-2 backdrop-blur">
              <Play size={14} />
              {t.hero.demo}
            </a>
          </div>
        </div>

        {/* Product Preview — Premium */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-1.5 shadow-2xl shadow-[#6C2BD9]/10">
            <div className="bg-zinc-950 rounded-xl p-6">
              {/* Browser bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
                <div className="flex-1 bg-zinc-900 rounded-md h-6 flex items-center px-3">
                  <span className="text-[10px] text-zinc-600">app.aimio.ai/dashboard</span>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Sidebar */}
                <div className="w-44 shrink-0 space-y-0.5">
                  <div className="flex items-center gap-2 mb-5 px-2">
                    <Image src="/aimio-logo.png" alt="Aimio" width={70} height={20} className="invert opacity-90" />
                  </div>
                  {[
                    { n: "Dashboard", active: true },
                    { n: "Mandates", active: false },
                    { n: "Analytics", active: false },
                    { n: "Reports", active: false },
                    { n: "Messages", active: false, badge: "3" },
                  ].map((item) => (
                    <div key={item.n} className={`px-3 py-2 rounded-lg text-[10px] flex items-center justify-between ${item.active ? "bg-zinc-800 text-white font-medium" : "text-zinc-600"}`}>
                      {item.n}
                      {item.badge && <span className="bg-[#6C2BD9] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{item.badge}</span>}
                    </div>
                  ))}

                  {/* AI Insight mini */}
                  <div className="mt-4 bg-[#6C2BD9]/10 rounded-lg p-3 border border-[#6C2BD9]/20">
                    <p className="text-[8px] text-[#6C2BD9] font-bold uppercase tracking-wider mb-1">AI Insight</p>
                    <p className="text-[9px] text-zinc-400 leading-relaxed">3 top candidates ready for interview this week</p>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] text-white font-semibold">Welcome back, Sarah</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[9px] text-zinc-500">Live updates</span>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: "8", l: "Active mandates", c: "#6C2BD9" },
                      { v: "47", l: "Candidates delivered", c: "#10B981" },
                      { v: "18", l: "Interested", c: "#3B82F6" },
                      { v: "7", l: "Interviews scheduled", c: "#F59E0B" },
                    ].map((s) => (
                      <div key={s.l} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                        <p className="text-[18px] font-bold text-white">{s.v}</p>
                        <p className="text-[8px] text-zinc-600 uppercase tracking-wider">{s.l}</p>
                        <div className="mt-2 h-0.5 bg-zinc-800 rounded-full">
                          <div className="h-full rounded-full" style={{ width: "70%", backgroundColor: s.c }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Candidates */}
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Top candidates this week</p>
                        <span className="text-[8px] text-[#6C2BD9]">View all</span>
                      </div>
                      {[
                        { n: "Sarah Blackwood", s: "9.7", t: "Chief Estimator — 18 yrs", status: "new" },
                        { n: "Emily Chen", s: "9.4", t: "Director — 14 yrs", status: "interested" },
                        { n: "James Richardson", s: "8.9", t: "Senior Estimator — 9 yrs", status: "new" },
                        { n: "David Park", s: "8.3", t: "Senior Estimator — 7 yrs", status: "new" },
                        { n: "Michael Torres", s: "7.6", t: "Estimator — 5 yrs", status: "interview" },
                      ].map((c) => (
                        <div key={c.n} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center">
                              <span className="text-[7px] font-bold text-zinc-400">{c.n.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-white">{c.n}</span>
                              <p className="text-[8px] text-zinc-600">{c.t}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#6C2BD9]">{c.s}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${c.status === "new" ? "bg-[#6C2BD9]" : c.status === "interested" ? "bg-emerald-400" : "bg-blue-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Summary + Active mandates */}
                    <div className="space-y-2">
                      {/* AI Summary */}
                      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={10} className="text-[#6C2BD9]" />
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">AI Summary</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[{ v: "847", l: "Sourced" }, { v: "142", l: "Approached" }, { v: "47", l: "Delivered" }].map(s => (
                            <div key={s.l} className="bg-zinc-800/50 rounded-md p-2 text-center">
                              <p className="text-[12px] font-bold text-white">{s.v}</p>
                              <p className="text-[7px] text-zinc-600">{s.l}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#6C2BD9]/5 rounded-md p-2 border border-[#6C2BD9]/10">
                          <p className="text-[8px] text-zinc-400 leading-relaxed">Market trend: Senior estimator demand up 12% this quarter. Recommend adjusting salary range for faster results.</p>
                        </div>
                      </div>

                      {/* Active mandates */}
                      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Active mandates</p>
                        {[
                          { t: "Senior Estimator", l: "Toronto, ON", c: 12 },
                          { t: "Project Manager", l: "Vancouver, BC", c: 8 },
                          { t: "Financial Controller", l: "Toronto, ON", c: 15 },
                          { t: "Construction Manager", l: "Calgary, AB", c: 6 },
                        ].map((m) => (
                          <div key={m.t} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                            <div>
                              <p className="text-[10px] text-white">{m.t}</p>
                              <p className="text-[8px] text-zinc-600">{m.l}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-zinc-500">{m.c} candidates</span>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value propositions — bold statements */}
      <section className="py-24 px-6 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-16">
          {t.values.map((v: {title: string; desc: string}, i: number) => (
            <div key={i} className="text-center">
              <h3 className="text-[24px] font-bold text-zinc-900 tracking-tight mb-3">{v.title}</h3>
              <p className="text-[14px] text-zinc-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[12px] text-[#6C2BD9] font-semibold uppercase tracking-[0.2em] mb-4">{t.how.label}</p>
            <h2 className="text-[44px] font-bold text-zinc-900 tracking-tight leading-tight">{t.how.title}</h2>
          </div>

          <div className="grid grid-cols-3 gap-12">
            {[
              { icon: Search, num: "01", title: t.how.s1.title, desc: t.how.s1.desc },
              { icon: MessageSquare, num: "02", title: t.how.s2.title, desc: t.how.s2.desc },
              { icon: UserCheck, num: "03", title: t.how.s3.title, desc: t.how.s3.desc },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="text-[80px] font-bold text-zinc-50 absolute -top-8 -left-2">{step.num}</span>
                <div className="relative z-10 pt-12">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-5">
                    <step.icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-zinc-900 mb-3">{step.title}</h3>
                  <p className="text-[14px] text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform showcase */}
      <section id="platform" className="py-28 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] text-[#6C2BD9] font-semibold uppercase tracking-[0.2em] mb-4">{t.platform.label}</p>
            <h2 className="text-[44px] font-bold text-zinc-900 tracking-tight leading-tight">{t.platform.title}</h2>
            <p className="text-[16px] text-zinc-500 mt-4 max-w-2xl mx-auto">{t.platform.subtitle}</p>
          </div>

          {/* Feature tabs */}
          <div className="flex justify-center gap-1 mb-12 bg-zinc-200/50 p-1 rounded-full w-fit mx-auto">
            {t.platform.tabs.map((tab: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveDemo(i)}
                className={`px-6 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeDemo === i ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Feature descriptions */}
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              {activeDemo === 0 && (
                <div>
                  <h3 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-4">{t.platform.f1.title}</h3>
                  <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">{t.platform.f1.desc}</p>
                  <ul className="space-y-4">
                    {t.platform.f1.points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#6C2BD9]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#6C2BD9]" />
                        </div>
                        <span className="text-[14px] text-zinc-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeDemo === 1 && (
                <div>
                  <h3 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-4">{t.platform.f2.title}</h3>
                  <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">{t.platform.f2.desc}</p>
                  <ul className="space-y-4">
                    {t.platform.f2.points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#6C2BD9]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#6C2BD9]" />
                        </div>
                        <span className="text-[14px] text-zinc-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeDemo === 2 && (
                <div>
                  <h3 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-4">{t.platform.f3.title}</h3>
                  <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">{t.platform.f3.desc}</p>
                  <ul className="space-y-4">
                    {t.platform.f3.points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#6C2BD9]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#6C2BD9]" />
                        </div>
                        <span className="text-[14px] text-zinc-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Visual */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6">
              {activeDemo === 0 && (
                <div className="space-y-3">
                  {[
                    { n: "Sarah Blackwood", t: "Chief Estimator — Ledcor", s: 9.7, status: "New" },
                    { n: "Emily Chen", t: "Director — PCL Construction", s: 9.4, status: "Interested" },
                    { n: "James Richardson", t: "Senior Estimator — EllisDon", s: 8.9, status: "New" },
                  ].map((c) => (
                    <div key={c.n} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-zinc-600">{c.n.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-zinc-900">{c.n}</p>
                        <p className="text-[11px] text-zinc-400">{c.t}</p>
                      </div>
                      <span className="text-[14px] font-bold text-[#6C2BD9]">{c.s}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeDemo === 1 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                      <span className="text-[13px] font-semibold text-zinc-600">SB</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-zinc-900">Sarah Blackwood</p>
                      <p className="text-[11px] text-zinc-400">18 years experience</p>
                    </div>
                    <div className="ml-auto text-center">
                      <p className="text-[28px] font-bold text-[#6C2BD9]">9.7</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Experience", "Technical", "Leadership", "Location", "Culture fit"].map((c, i) => (
                      <div key={c} className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-400 w-20">{c}</span>
                        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full">
                          <div className="h-full bg-[#6C2BD9] rounded-full" style={{ width: `${[100, 100, 100, 90, 100][i]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeDemo === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-[#6C2BD9]" />
                    <p className="text-[12px] font-semibold text-zinc-900">AI Weekly Insights</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ v: "312", l: "Sourced" }, { v: "58", l: "Approached" }, { v: "5", l: "Delivered" }].map(s => (
                      <div key={s.l} className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 text-center">
                        <p className="text-[18px] font-semibold text-zinc-900">{s.v}</p>
                        <p className="text-[9px] text-zinc-400">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#6C2BD9]/5 rounded-lg p-4 border border-[#6C2BD9]/10">
                    <p className="text-[10px] text-[#6C2BD9] font-semibold uppercase tracking-wider mb-1">AI Recommendation</p>
                    <p className="text-[12px] text-zinc-600 leading-relaxed">Adjust salary range to $110-125K and offer hybrid flexibility to increase qualified candidate pool by 40%.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits — Bold statements */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-20">
            {[
              { icon: Zap, title: t.benefits.b1.title, desc: t.benefits.b1.desc },
              { icon: Shield, title: t.benefits.b2.title, desc: t.benefits.b2.desc },
              { icon: BarChart3, title: t.benefits.b3.title, desc: t.benefits.b3.desc },
              { icon: Globe, title: t.benefits.b4.title, desc: t.benefits.b4.desc },
            ].map((b) => (
              <div key={b.title} className="flex gap-5">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shrink-0">
                  <b.icon size={22} className="text-zinc-900" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-zinc-900 mb-2">{b.title}</h3>
                  <p className="text-[14px] text-zinc-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[44px] font-bold text-zinc-900 tracking-tight">{t.pricing.title}</h2>
            <p className="text-[16px] text-zinc-500 mt-4">{t.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "1,999", desc: t.pricing.s1desc, features: t.pricing.s1f, pop: false },
              { name: "Pro", price: "2,999", desc: t.pricing.s2desc, features: t.pricing.s2f, pop: true },
              { name: "Enterprise", price: "4,999", desc: t.pricing.s3desc, features: t.pricing.s3f, pop: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 relative ${plan.pop ? "bg-zinc-900 text-white ring-2 ring-[#6C2BD9]" : "bg-white border border-zinc-200"}`}>
                {plan.pop && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6C2BD9] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {t.pricing.popular}
                  </div>
                )}
                <p className="text-[14px] font-semibold mb-1">{plan.name}</p>
                <p className={`text-[12px] mb-6 ${plan.pop ? "text-zinc-400" : "text-zinc-400"}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-[40px] font-bold tracking-tight">${plan.price}</span>
                  <span className={`text-[13px] ${plan.pop ? "text-zinc-400" : "text-zinc-400"}`}>/{t.pricing.mo}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f: string) => (
                    <li key={f} className={`flex items-start gap-2.5 text-[13px] ${plan.pop ? "text-zinc-300" : "text-zinc-600"}`}>
                      <Check size={14} className={`mt-0.5 shrink-0 ${plan.pop ? "text-[#6C2BD9]" : "text-zinc-400"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" className={`w-full py-3.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  plan.pop ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}>
                  {t.pricing.cta} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-zinc-400 mt-8">{t.pricing.note}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#6C2BD9]/10 rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-[44px] font-bold text-white tracking-tight mb-6">{t.cta.title}</h2>
          <p className="text-[16px] text-zinc-400 mb-10">{t.cta.subtitle}</p>
          <a href="#" className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-zinc-900 rounded-full text-[15px] font-semibold hover:bg-zinc-100 transition-all duration-200">
            {t.cta.button}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#6C2BD9] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[7px] tracking-wider">iii</span>
            </div>
            <span className="text-[12px] text-zinc-600">© 2026 Aimio Inc.</span>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-zinc-600">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
            <a href="mailto:info@aimio.ai" className="hover:text-zinc-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const en = {
  nav: { how: "How it works", platform: "Platform", pricing: "Pricing", cta: "Get started" },
  hero: {
    badge: "AI-Powered Recruitment Platform",
    line1: "Your AI recruiting team.",
    line2: "On demand.",
    subtitle: "We source, contact, and qualify candidates for you. You receive pre-screened, interested talent — ready to interview.",
    cta: "Get started free",
    demo: "See the platform",
  },
  values: [
    { title: "Pre-qualified talent", desc: "Every candidate has been contacted, screened, and has confirmed interest in your role." },
    { title: "AI-powered precision", desc: "10-criteria scoring customized to your requirements. See strengths and concerns at a glance." },
    { title: "Your dedicated portal", desc: "Track candidates, review scores, and manage your pipeline — all in one place." },
  ],
  how: {
    label: "How it works",
    title: "Three steps to your next hire",
    s1: { title: "AI-powered sourcing", desc: "Our AI scans the market continuously to identify the best passive candidates for your open roles. Hundreds of profiles reviewed daily." },
    s2: { title: "Human qualification", desc: "We personally reach out to top matches, validate interest, motivation, salary expectations, and availability through real conversations." },
    s3: { title: "Ready-to-interview candidates", desc: "You receive only interested, qualified candidates with detailed AI scoring. Review profiles, give feedback, and interview — all from your portal." },
  },
  platform: {
    label: "The platform",
    title: "Everything you need. Nothing you don't.",
    subtitle: "A dedicated portal where you track candidates, review AI scores, and manage your entire hiring pipeline.",
    tabs: ["Candidates", "AI Scoring", "Insights"],
    f1: {
      title: "Pre-screened candidates delivered to you",
      desc: "Every candidate in your portal has been sourced by AI, contacted by our team, and has confirmed interest in your role.",
      points: ["Only interested candidates — no cold profiles", "Detailed career history and motivation notes", "Real-time updates as new candidates are delivered"],
    },
    f2: {
      title: "AI scoring on 10 custom criteria",
      desc: "Each candidate is scored automatically by our AI based on criteria tailored to your specific role and requirements.",
      points: ["10 weighted criteria customized per role", "Visual scoring breakdown at a glance", "Strengths and points of concern highlighted"],
    },
    f3: {
      title: "Market intelligence that drives decisions",
      desc: "Weekly AI-generated insights give you a competitive edge in your hiring decisions.",
      points: ["Salary benchmarks for your market", "Candidate availability analysis", "Actionable recommendations to improve results"],
    },
  },
  benefits: {
    b1: { title: "Faster than traditional recruiting", desc: "Our AI works around the clock. You receive your first qualified candidates within days, not weeks." },
    b2: { title: "Pre-qualified and interested", desc: "Every candidate has been personally contacted and has confirmed interest. No wasted interviews." },
    b3: { title: "Data-driven hiring decisions", desc: "AI scoring, market benchmarks, and weekly insights give you clarity at every step." },
    b4: { title: "Available globally", desc: "We source talent worldwide. Our platform supports English, French, and Spanish." },
  },
  pricing: {
    title: "Simple pricing. Powerful results.",
    subtitle: "Predictable monthly fee. No hidden costs. Cancel anytime.",
    popular: "Most popular",
    mo: "mo",
    cta: "Get started",
    note: "No setup fees. No long-term commitment. Cancel anytime.",
    s1desc: "For teams hiring 1-2 roles",
    s2desc: "For growing companies",
    s3desc: "For high-volume hiring",
    s1f: ["Up to 2 active positions", "Pre-screened candidates weekly", "AI scoring on 10 criteria", "Client portal access", "Weekly reports", "Email support"],
    s2f: ["Up to 5 active positions", "Priority candidate delivery", "AI scoring on 10 criteria", "Client portal + analytics", "Weekly reports + AI insights", "Dedicated account manager"],
    s3f: ["10+ active positions", "Premium candidate delivery", "Custom AI scoring criteria", "Full analytics dashboard", "Phone qualification included", "Custom reporting + SLA"],
  },
  cta: {
    title: "Ready to transform your hiring?",
    subtitle: "Get your first qualified candidates for free. No obligation. See the quality for yourself.",
    button: "Start for free",
  },
};

const fr = {
  nav: { how: "Fonctionnement", platform: "Plateforme", pricing: "Tarifs", cta: "Commencer" },
  hero: {
    badge: "Plateforme de recrutement propulsee par l'IA",
    line1: "Votre equipe de recrutement IA.",
    line2: "Sur demande.",
    subtitle: "On source, contacte et qualifie les candidats pour vous. Vous recevez des talents pre-qualifies et interesses — prets a interviewer.",
    cta: "Commencer gratuitement",
    demo: "Voir la plateforme",
  },
  values: [
    { title: "Talents pre-qualifies", desc: "Chaque candidat a ete contacte, evalue et a confirme son interet pour votre poste." },
    { title: "Precision propulsee par l'IA", desc: "Scoring sur 10 criteres personnalises. Forces et points d'attention en un coup d'oeil." },
    { title: "Votre portail dedie", desc: "Suivez les candidats, consultez les scores et gerez votre pipeline — au meme endroit." },
  ],
  how: {
    label: "Comment ca marche",
    title: "Trois etapes vers votre prochaine embauche",
    s1: { title: "Sourcing propulse par l'IA", desc: "Notre IA scanne le marche en continu pour identifier les meilleurs candidats passifs pour vos postes ouverts." },
    s2: { title: "Qualification humaine", desc: "On contacte personnellement les meilleurs profils, on valide l'interet, la motivation, les attentes salariales et la disponibilite." },
    s3: { title: "Candidats prets a interviewer", desc: "Vous recevez uniquement des candidats interesses et qualifies avec un scoring IA detaille. Le tout dans votre portail." },
  },
  platform: {
    label: "La plateforme",
    title: "Tout ce dont vous avez besoin. Rien de plus.",
    subtitle: "Un portail dedie ou vous suivez les candidats, consultez les scores IA et gerez votre pipeline.",
    tabs: ["Candidats", "Scoring IA", "Intelligence"],
    f1: {
      title: "Candidats pre-qualifies livres chez vous",
      desc: "Chaque candidat dans votre portail a ete source par l'IA, contacte par notre equipe et a confirme son interet.",
      points: ["Uniquement des candidats interesses", "Historique de carriere et notes de motivation", "Mises a jour en temps reel"],
    },
    f2: {
      title: "Scoring IA sur 10 criteres personnalises",
      desc: "Chaque candidat est score automatiquement par notre IA selon des criteres adaptes a votre poste.",
      points: ["10 criteres ponderes par poste", "Visualisation du scoring en un coup d'oeil", "Forces et points d'attention identifies"],
    },
    f3: {
      title: "Intelligence de marche pour mieux decider",
      desc: "Des insights hebdomadaires generes par l'IA pour un avantage competitif dans vos decisions.",
      points: ["Benchmarks salariaux pour votre marche", "Analyse de disponibilite des candidats", "Recommandations actionnables"],
    },
  },
  benefits: {
    b1: { title: "Plus rapide que le recrutement traditionnel", desc: "Notre IA travaille 24/7. Vous recevez vos premiers candidats qualifies en quelques jours." },
    b2: { title: "Pre-qualifies et interesses", desc: "Chaque candidat a ete contacte personnellement et a confirme son interet. Zero entrevue gaspillee." },
    b3: { title: "Decisions basees sur les donnees", desc: "Scoring IA, benchmarks de marche et insights hebdomadaires pour plus de clarte." },
    b4: { title: "Disponible mondialement", desc: "On source des talents partout. Notre plateforme supporte l'anglais, le francais et l'espagnol." },
  },
  pricing: {
    title: "Tarification simple. Resultats puissants.",
    subtitle: "Forfait mensuel previsible. Aucun frais cache. Annulez en tout temps.",
    popular: "Le plus populaire",
    mo: "mois",
    cta: "Commencer",
    note: "Aucun frais de setup. Aucun engagement. Annulez en tout temps.",
    s1desc: "Pour les equipes qui recrutent 1-2 postes",
    s2desc: "Pour les entreprises en croissance",
    s3desc: "Pour le recrutement a haut volume",
    s1f: ["Jusqu'a 2 postes actifs", "Candidats pre-qualifies chaque semaine", "Scoring IA sur 10 criteres", "Acces au portail client", "Rapports hebdomadaires", "Support par courriel"],
    s2f: ["Jusqu'a 5 postes actifs", "Livraison prioritaire", "Scoring IA sur 10 criteres", "Portail + analytique", "Rapports + intelligence IA", "Gestionnaire de compte dedie"],
    s3f: ["10+ postes actifs", "Livraison premium", "Criteres IA personnalises", "Dashboard analytique complet", "Pre-qualification telephonique incluse", "Rapports personnalises + SLA"],
  },
  cta: {
    title: "Pret a transformer votre recrutement?",
    subtitle: "Recevez vos premiers candidats qualifies gratuitement. Aucune obligation.",
    button: "Commencer gratuitement",
  },
};
