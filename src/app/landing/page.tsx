"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Check, X, Search, MessageSquare, UserCheck, BarChart3, Shield, Zap, Globe, Clock, Users, ChevronRight, Sparkles, Play, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [activeDemo, setActiveDemo] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const t = lang === "en" ? en : fr;

  // Auto-detect browser language + URL param support
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get("lang");
    if (urlParam === "fr" || urlParam === "en") {
      setLang(urlParam);
      return;
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("fr")) setLang("fr");
  }, []);

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Mouse tracker for hero cursor glow
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const hero = document.getElementById("hero-section");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      if (e.clientY < rect.bottom && e.clientY > rect.top) {
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Lead form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    country: "",
    role: "",
    team_size: "",
    active_mandates: "",
    hiring_for: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; isQuebec?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setSubmitResult({
        success: true,
        message: data.message,
        isQuebec: data.is_quebec_lead,
      });
      // Reset form on success
      setForm({ name: "", email: "", company: "", country: "", role: "", team_size: "", active_mandates: "", hiring_for: "", message: "" });
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : "Something went wrong. Please email us directly at marcantoine.cote@aimiorecrutement.com",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100/50 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/aimio-logo.png" alt="Aimio" width={90} height={26} />
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.how}</a>
            <a href="#platform" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.platform}</a>
            <a href="#pricing" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">{t.nav.pricing}</a>
            <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="text-[11px] text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-full px-2.5 py-1 transition-all duration-200">
              {lang === "en" ? "FR" : "EN"}
            </button>
            <a href="/login" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-all duration-200">
              {lang === "en" ? "Login" : "Connexion"}
            </a>
            <a href="https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting" target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-zinc-900 text-white rounded-full text-[13px] font-medium hover:bg-zinc-800 transition-all duration-200">
              {t.nav.cta}
            </a>
          </div>
          <div className="flex md:hidden items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="text-[11px] text-zinc-400 border border-zinc-200 rounded-full px-2.5 py-1">
              {lang === "en" ? "FR" : "EN"}
            </button>
            <a href="/login" className="text-[12px] text-zinc-500 hover:text-zinc-900">
              {lang === "en" ? "Login" : "Connexion"}
            </a>
            <a href="https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-zinc-900 text-white rounded-full text-[12px] font-medium">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — Dark, Premium Editorial with cursor glow */}
      <section id="hero-section" className="relative bg-zinc-950 overflow-hidden">
        {/* Mouse-following cursor glow */}
        <div className="cursor-glow hidden md:block" style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }} />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-[#2445EB]/25 rounded-full blur-[160px] float-orb" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#4B5DF5]/20 rounded-full blur-[130px] float-orb" style={{ animationDelay: "5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7A8FF5]/10 rounded-full blur-[200px]" />

        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 md:pt-36 pb-20 md:pb-32 text-center">
          {/* Editorial label */}
          <div className="flex items-center justify-center gap-4 mb-10 opacity-70">
            <div className="h-px w-12 bg-white/30" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/60 font-medium">
              {lang === "en" ? "The future of hiring" : "Le futur du recrutement"}
            </span>
            <div className="h-px w-12 bg-white/30" />
          </div>

          <h1 className="font-display text-[56px] md:text-[112px] lg:text-[152px] font-semibold text-white tracking-[-0.04em] leading-[0.88] mb-2">
            {t.hero.line1}
          </h1>
          <h2 className="font-display text-[56px] md:text-[112px] lg:text-[152px] font-semibold tracking-[-0.04em] leading-[1.05] pb-4 mb-14 gradient-text" style={{ fontStyle: "italic" }}>
            {t.hero.line2}
          </h2>

          <p className="text-[18px] md:text-[22px] text-zinc-300 max-w-3xl mx-auto leading-[1.5] mb-14 font-light">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a href="https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting" target="_blank" rel="noopener noreferrer" className="group shine-btn px-8 py-4 bg-white text-zinc-900 rounded-full text-[14px] font-semibold hover:bg-zinc-100 transition-all duration-200 flex items-center gap-2 shadow-2xl shadow-white/10">
              {t.hero.cta}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#platform" className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full text-[14px] font-medium hover:bg-white/10 transition-all duration-200 flex items-center gap-2 backdrop-blur">
              <Play size={13} />
              {t.hero.demo}
            </a>
          </div>

          {/* Signature trust line */}
          <div className="pt-10 border-t border-white/5 max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">
              {lang === "en" ? "Trusted by growing companies across the world" : "Utilisé par des entreprises en croissance dans le monde"}
            </p>
          </div>
        </div>

        {/* Product Preview — Premium (hidden on mobile) */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20 hidden md:block">
          <div className="bg-white rounded-2xl border border-zinc-200 p-1.5 shadow-2xl shadow-black/20">
            <div className="bg-[#fafafa] rounded-xl p-6">
              {/* Browser bar */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-zinc-100 rounded-md h-6 flex items-center px-3">
                  <span className="text-[10px] text-zinc-400">app.aimio.ai/dashboard</span>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Sidebar */}
                <div className="w-44 shrink-0 space-y-0.5">
                  <div className="flex items-center gap-2 mb-5 px-2">
                    <Image src="/aimio-logo.png" alt="Aimio" width={70} height={20} />
                  </div>
                  {[
                    { n: "Dashboard", active: true },
                    { n: "Mandates", active: false },
                    { n: "Analytics", active: false },
                    { n: "Reports", active: false },
                    { n: "Messages", active: false, badge: "3" },
                  ].map((item) => (
                    <div key={item.n} className={`px-3 py-2 rounded-lg text-[10px] flex items-center justify-between ${item.active ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-400"}`}>
                      {item.n}
                      {item.badge && <span className="bg-[#2445EB] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{item.badge}</span>}
                    </div>
                  ))}

                  {/* AI Insight mini */}
                  <div className="mt-4 bg-[#2445EB]/5 rounded-lg p-3 border border-[#2445EB]/10">
                    <p className="text-[8px] text-[#2445EB] font-bold uppercase tracking-wider mb-1">AI Insight</p>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">3 top candidates ready for interview this week</p>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] text-zinc-900 font-semibold">Welcome back, Sarah</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-zinc-400">Live updates</span>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: "8", l: "Active mandates", c: "#2445EB" },
                      { v: "47", l: "Candidates delivered", c: "#10B981" },
                      { v: "18", l: "Interested", c: "#3B82F6" },
                      { v: "7", l: "Interviews scheduled", c: "#F59E0B" },
                    ].map((s) => (
                      <div key={s.l} className="bg-white rounded-lg p-3 border border-zinc-100 shadow-sm">
                        <p className="text-[18px] font-bold text-zinc-900">{s.v}</p>
                        <p className="text-[8px] text-zinc-400 uppercase tracking-wider">{s.l}</p>
                        <div className="mt-2 h-0.5 bg-zinc-100 rounded-full">
                          <div className="h-full rounded-full" style={{ width: "70%", backgroundColor: s.c }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Candidates */}
                    <div className="bg-white rounded-lg border border-zinc-100 p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Top candidates this week</p>
                        <span className="text-[8px] text-[#2445EB]">View all</span>
                      </div>
                      {[
                        { n: "Sarah Blackwood", s: "9.7", t: "Chief Estimator — 18 yrs", status: "new" },
                        { n: "Emily Chen", s: "9.4", t: "Director — 14 yrs", status: "interested" },
                        { n: "James Richardson", s: "8.9", t: "Senior Estimator — 9 yrs", status: "new" },
                        { n: "David Park", s: "8.3", t: "Senior Estimator — 7 yrs", status: "new" },
                        { n: "Michael Torres", s: "7.6", t: "Estimator — 5 yrs", status: "interview" },
                      ].map((c) => (
                        <div key={c.n} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center">
                              <span className="text-[7px] font-bold text-zinc-500">{c.n.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-900">{c.n}</span>
                              <p className="text-[8px] text-zinc-600">{c.t}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#2445EB]">{c.s}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${c.status === "new" ? "bg-[#2445EB]" : c.status === "interested" ? "bg-emerald-400" : "bg-blue-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Summary + Active mandates */}
                    <div className="space-y-2">
                      {/* AI Summary */}
                      <div className="bg-white rounded-lg border border-zinc-100 p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={10} className="text-[#2445EB]" />
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">AI Summary</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[{ v: "847", l: "Found" }, { v: "142", l: "Contacted" }, { v: "47", l: "Delivered" }].map(s => (
                            <div key={s.l} className="bg-white rounded-md p-2 text-center">
                              <p className="text-[12px] font-bold text-zinc-900">{s.v}</p>
                              <p className="text-[7px] text-zinc-600">{s.l}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#2445EB]/5 rounded-md p-2 border border-[#2445EB]/10">
                          <p className="text-[8px] text-zinc-500 leading-relaxed">Market trend: Senior estimator demand up 12% this quarter. Recommend adjusting salary range for faster results.</p>
                        </div>
                      </div>

                      {/* Active mandates */}
                      <div className="bg-white rounded-lg border border-zinc-100 p-3 shadow-sm">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Active mandates</p>
                        {[
                          { t: "Senior Estimator", l: "Toronto, ON", c: 12 },
                          { t: "Project Manager", l: "Vancouver, BC", c: 8 },
                          { t: "Financial Controller", l: "Toronto, ON", c: 15 },
                          { t: "Construction Manager", l: "Calgary, AB", c: 6 },
                        ].map((m) => (
                          <div key={m.t} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0">
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
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
          {t.values.map((v: {title: string; desc: string}, i: number) => (
            <div key={i} className="text-center group">
              <h3 className="font-display text-[28px] md:text-[32px] font-semibold text-zinc-900 tracking-[-0.02em] mb-4 leading-tight">{v.title}</h3>
              <p className="text-[15px] text-zinc-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#2445EB]/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#7A8FF5]/8 rounded-full blur-[100px] -z-10" />
        <div className="max-w-5xl mx-auto relative">
          <div className="reveal text-center mb-20">
            <p className="text-[12px] text-[#2445EB] font-semibold uppercase tracking-[0.2em] mb-4">{t.how.label}</p>
            <h2 className="font-display text-[40px] md:text-[64px] lg:text-[72px] font-semibold text-zinc-900 tracking-[-0.02em] leading-[1.05]">{t.how.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
      <section id="platform" className="py-28 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-[#2445EB]/5 rounded-full blur-[140px] -z-10" />
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-16">
            <p className="text-[12px] text-[#2445EB] font-semibold uppercase tracking-[0.2em] mb-4">{t.platform.label}</p>
            <h2 className="font-display text-[40px] md:text-[64px] lg:text-[72px] font-semibold text-zinc-900 tracking-[-0.02em] leading-[1.05]">{t.platform.title}</h2>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              {activeDemo === 0 && (
                <div>
                  <h3 className="text-[28px] font-bold text-zinc-900 tracking-tight mb-4">{t.platform.f1.title}</h3>
                  <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">{t.platform.f1.desc}</p>
                  <ul className="space-y-4">
                    {t.platform.f1.points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-[#2445EB]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#2445EB]" />
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
                        <div className="w-5 h-5 bg-[#2445EB]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#2445EB]" />
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
                        <div className="w-5 h-5 bg-[#2445EB]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                          <Check size={12} className="text-[#2445EB]" />
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
                    <div key={c.n} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-100">
                      <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-zinc-600">{c.n.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-zinc-900">{c.n}</p>
                        <p className="text-[11px] text-zinc-400">{c.t}</p>
                      </div>
                      <span className="text-[14px] font-bold text-[#2445EB]">{c.s}</span>
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
                      <p className="text-[28px] font-bold text-[#2445EB]">9.7</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Experience", "Technical", "Leadership", "Location", "Culture fit"].map((c, i) => (
                      <div key={c} className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-400 w-20">{c}</span>
                        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full">
                          <div className="h-full bg-[#2445EB] rounded-full" style={{ width: `${[100, 100, 100, 90, 100][i]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeDemo === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-[#2445EB]" />
                    <p className="text-[12px] font-semibold text-zinc-900">AI Weekly Insights</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ v: "312", l: "Found" }, { v: "58", l: "Contacted" }, { v: "5", l: "Delivered" }].map(s => (
                      <div key={s.l} className="bg-white rounded-lg p-3 border border-zinc-100 text-center">
                        <p className="text-[18px] font-semibold text-zinc-900">{s.v}</p>
                        <p className="text-[9px] text-zinc-400">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#2445EB]/5 rounded-lg p-4 border border-[#2445EB]/10">
                    <p className="text-[10px] text-[#2445EB] font-semibold uppercase tracking-wider mb-1">AI Recommendation</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
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

      {/* Comparison Table — Apple-style minimal */}
      <section id="compare" className="py-32 md:py-40 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-20">
            <h2 className="font-display text-[44px] md:text-[64px] lg:text-[72px] font-semibold text-zinc-900 tracking-[-0.02em] leading-[1.05]">{t.compare.title}</h2>
            <p className="text-[17px] text-zinc-500 mt-5 max-w-2xl mx-auto leading-relaxed">{t.compare.subtitle}</p>
          </div>

          <div className="reveal overflow-x-auto">
            <table className="w-full min-w-[820px]">
              {/* Apple-style column headers with icons */}
              <thead>
                <tr>
                  <th className="py-8 px-6 w-[28%]"></th>
                  <th className="py-8 px-4 text-center w-[18%]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                        <FileText size={18} className="text-zinc-500" strokeWidth={1.5} />
                      </div>
                      <span className="text-[13px] font-medium text-zinc-700">{t.compare.c1}</span>
                    </div>
                  </th>
                  <th className="py-8 px-4 text-center w-[18%]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                        <Users size={18} className="text-zinc-500" strokeWidth={1.5} />
                      </div>
                      <span className="text-[13px] font-medium text-zinc-700">{t.compare.c2}</span>
                    </div>
                  </th>
                  <th className="py-8 px-4 text-center w-[18%]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                        <BarChart3 size={18} className="text-zinc-500" strokeWidth={1.5} />
                      </div>
                      <span className="text-[13px] font-medium text-zinc-700">{t.compare.c3}</span>
                    </div>
                  </th>
                  <th className="py-8 px-4 text-center w-[18%]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2445EB] flex items-center justify-center shadow-lg shadow-[#2445EB]/25">
                        {/* Aimio iii mark */}
                        <div className="flex gap-[3px] items-end">
                          <div className="w-[3px] h-4 bg-white rounded-sm" />
                          <div className="w-[3px] h-5 bg-white rounded-sm" />
                          <div className="w-[3px] h-[22px] bg-white rounded-sm" />
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-900">{t.compare.c4}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.compare.rows.map((row: {label: string; v1: string; v2: string; v3: string; v4: string}, i: number) => (
                  <tr
                    key={i}
                    className="reveal border-t border-zinc-100"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <td className="py-7 px-6 text-[14px] font-semibold text-zinc-900">{row.label}</td>
                    <td className="py-7 px-4 text-center text-[13px] text-zinc-500 leading-relaxed">{row.v1}</td>
                    <td className="py-7 px-4 text-center text-[13px] text-zinc-500 leading-relaxed">{row.v2}</td>
                    <td className="py-7 px-4 text-center text-[13px] text-zinc-500 leading-relaxed">{row.v3}</td>
                    <td className="py-7 px-4 text-center text-[13px] font-semibold text-zinc-900 leading-relaxed bg-[#2445EB]/[0.04]">
                      {row.v4}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA to pricing */}
          <div className="reveal mt-16 flex items-center justify-center">
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#2445EB] hover:text-[#1A36C4] transition-colors"
            >
              {lang === "en" ? "See full pricing" : "Voir les tarifs complets"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#2445EB]/5 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7A8FF5]/8 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto">
          <div className="reveal text-center mb-16">
            <h2 className="text-[28px] md:text-[44px] font-bold text-zinc-900 tracking-tight">{t.pricing.title}</h2>
            <p className="text-[16px] text-zinc-500 mt-4">{t.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Starter", price: "2,999", desc: t.pricing.s1desc, features: t.pricing.s1f, pop: false, custom: false },
              { name: "Growth", price: "4,999", desc: t.pricing.s2desc, features: t.pricing.s2f, pop: true, custom: false },
              { name: "Scale", price: "9,999", desc: t.pricing.s3desc, features: t.pricing.s3f, pop: false, custom: false },
              { name: "Enterprise", price: "Custom", desc: (t.pricing as { s4desc?: string }).s4desc || "Replace your full hiring function", features: (t.pricing as { s4f?: string[] }).s4f || ["8+ active roles · unlimited candidates", "Custom AI training", "Dedicated team", "Daily syncs", "White-label reporting"], pop: false, custom: true },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 relative hover-glow ${plan.pop ? "bg-zinc-900 text-white ring-2 ring-[#2445EB] pulse-glow" : "bg-white border border-zinc-200"}`}>
                {plan.pop && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2445EB] text-white text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                    {t.pricing.popular}
                  </div>
                )}
                <p className="text-[14px] font-semibold mb-1">{plan.name}</p>
                <p className={`text-[11px] mb-5 ${plan.pop ? "text-zinc-400" : "text-zinc-500"}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  {plan.custom ? (
                    <span className="text-[28px] font-bold tracking-tight">{plan.price}</span>
                  ) : (
                    <>
                      <span className="text-[34px] font-bold tracking-tight">${plan.price}</span>
                      <span className={`text-[12px] ${plan.pop ? "text-zinc-400" : "text-zinc-400"}`}>/{t.pricing.mo}</span>
                    </>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f: string) => (
                    <li key={f} className={`flex items-start gap-2 text-[12px] ${plan.pop ? "text-zinc-300" : "text-zinc-600"}`}>
                      <Check size={12} className={`mt-1 shrink-0 ${plan.pop ? "text-[#2445EB]" : "text-zinc-400"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting" target="_blank" rel="noopener noreferrer" className={`w-full py-3 rounded-full text-[12px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  plan.pop ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}>
                  {plan.custom ? (lang === "en" ? "Talk to sales" : "Parler aux ventes") : t.pricing.cta} <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-zinc-400 mt-8">{t.pricing.note}</p>
        </div>
      </section>

      {/* Guarantee + ROI — NEW */}
      <section className="py-28 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left — Guarantee */}
            <div>
              <div className="w-14 h-14 bg-[#2445EB]/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield size={26} className="text-[#2445EB]" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] text-[#2445EB] font-semibold uppercase tracking-[0.2em] mb-3">{t.guarantee.label}</p>
              <h2 className="text-[30px] md:text-[40px] font-bold text-zinc-900 tracking-tight leading-tight mb-4">{t.guarantee.title}</h2>
              <p className="text-[15px] text-zinc-600 leading-relaxed mb-6">{t.guarantee.desc}</p>
              <ul className="space-y-3">
                {t.guarantee.points.map((p: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#2445EB]/10 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <Check size={12} className="text-[#2445EB]" />
                    </div>
                    <span className="text-[14px] text-zinc-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — ROI Calculator */}
            <div className="bg-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-[#2445EB]/20 rounded-full blur-[100px]" />
              <div className="relative z-10">
                <p className="text-[11px] text-[#7A8FF5] font-semibold uppercase tracking-[0.2em] mb-3">{t.guarantee.roi_label}</p>
                <h3 className="text-[22px] font-bold tracking-tight mb-6">{t.guarantee.roi_title}</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-[12px] text-zinc-400 max-w-[60%]">{t.guarantee.roi_internal}</span>
                    <span className="text-[18px] font-bold text-white">$117,500/yr</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <span className="text-[12px] text-zinc-400 max-w-[60%]">{t.guarantee.roi_aimio}</span>
                    <span className="text-[18px] font-bold text-white">$59,988/yr</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[14px] font-semibold text-white">{t.guarantee.roi_save}</span>
                    <span className="text-[28px] font-bold text-[#7A8FF5]">$57,512/yr</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 mt-6 leading-relaxed">{t.guarantee.roi_note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book a Demo Form */}
      <section id="book-demo" className="py-28 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] text-[#2445EB] font-semibold uppercase tracking-[0.2em] mb-4">
              {lang === "en" ? "Book your demo" : "Réservez votre démo"}
            </p>
            <h2 className="text-[32px] md:text-[44px] font-bold text-zinc-900 tracking-tight leading-tight mb-4">
              {lang === "en" ? "Talk to a recruiting expert." : "Parlez à un expert en recrutement."}
            </h2>
            <p className="text-[15px] text-zinc-500 leading-relaxed max-w-xl mx-auto">
              {lang === "en"
                ? "30-min discovery call. We'll understand your hiring needs and show you how Aimio can deliver qualified candidates in days, not weeks."
                : "Appel de découverte de 30 min. On comprend vos besoins et on vous montre comment Aimio livre des candidats qualifiés en quelques jours."}
            </p>
          </div>

          {submitResult?.success ? (
            <div className={`rounded-2xl p-8 text-center ${
              submitResult.isQuebec
                ? "bg-amber-50 border border-amber-200"
                : "bg-emerald-50 border border-emerald-200"
            }`}>
              <CheckCircle2 size={36} className={`mx-auto mb-4 ${
                submitResult.isQuebec ? "text-amber-500" : "text-emerald-500"
              }`} />
              <h3 className="text-[18px] font-semibold text-zinc-900 mb-2">
                {lang === "en" ? "Got it — we'll be in touch shortly." : "Reçu — on vous contacte rapidement."}
              </h3>
              <p className="text-[14px] text-zinc-600 max-w-md mx-auto">{submitResult.message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Full name *" : "Nom complet *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={lang === "en" ? "Jane Doe" : "Marie Tremblay"}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Work email *" : "Courriel professionnel *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={lang === "en" ? "you@company.com" : "vous@entreprise.com"}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Company *" : "Entreprise *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder={lang === "en" ? "Acme Inc." : "Votre entreprise"}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Your role" : "Votre poste"}
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder={lang === "en" ? "Head of Talent" : "VP People"}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Country *" : "Pays *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder={lang === "en" ? "United States" : "États-Unis"}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    {lang === "en" ? "Team size" : "Taille d'équipe"}
                  </label>
                  <select
                    value={form.team_size}
                    onChange={(e) => setForm({ ...form, team_size: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                  >
                    <option value="">—</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  {lang === "en" ? "How many roles are you actively hiring for?" : "Combien de postes recrutez-vous activement?"}
                </label>
                <select
                  value={form.active_mandates}
                  onChange={(e) => setForm({ ...form, active_mandates: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none bg-white"
                >
                  <option value="">—</option>
                  <option value="1-2">1-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-10">6-10</option>
                  <option value="10+">10+</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  {lang === "en" ? "What roles are you hiring for?" : "Quels postes recrutez-vous?"}
                </label>
                <input
                  type="text"
                  value={form.hiring_for}
                  onChange={(e) => setForm({ ...form, hiring_for: e.target.value })}
                  placeholder={lang === "en" ? "e.g. Senior Engineers, Product Managers" : "ex: Devs seniors, Chefs de produit"}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                />
              </div>

              <div className="mb-6">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  {lang === "en" ? "Anything else we should know?" : "Quelque chose d'autre à savoir?"}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  placeholder={lang === "en" ? "Tell us about your hiring challenges..." : "Parlez-nous de vos défis de recrutement..."}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[14px] resize-none focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none placeholder:text-zinc-300"
                />
              </div>

              {submitResult && !submitResult.success && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-red-700">{submitResult.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#2445EB] hover:bg-[#1A36C4] disabled:opacity-50 text-white rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> {lang === "en" ? "Submitting..." : "Envoi..."}
                  </>
                ) : (
                  <>
                    {lang === "en" ? "Book my demo" : "Réserver ma démo"} <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-400 text-center mt-4">
                {lang === "en"
                  ? "We'll respond within 24 hours. No spam, ever."
                  : "Réponse sous 24h. Pas de spam, promis."}
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#2445EB]/10 rounded-full blur-[150px]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-[44px] font-bold text-white tracking-tight mb-6">{t.cta.title}</h2>
          <p className="text-[16px] text-zinc-400 mb-10">{t.cta.subtitle}</p>
          <a href="https://meetings-na3.hubspot.com/olivier-bujold/virtual-recruiter-exploratory-meeting" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-zinc-900 rounded-full text-[15px] font-semibold hover:bg-zinc-100 transition-all duration-200">
            {t.cta.button}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/aimio-logo.png" alt="Aimio" width={60} height={18} className="invert opacity-50" />
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
  nav: { how: "How it works", platform: "Platform", pricing: "Pricing", cta: "Book a call" },
  hero: {
    badge: "The future of recruiting is here",
    line1: "Hire smarter.",
    line2: "Faster. Cheaper.",
    subtitle: "The future of hiring is here. Your AI recruiting team delivers qualified, pre-screened talent in days.",
    cta: "Book a demo",
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
    s1: { title: "AI-powered talent search", desc: "Our AI scans the market continuously across 50+ platforms to identify the best passive candidates for your open roles. Hundreds of profiles reviewed daily." },
    s2: { title: "Human qualification", desc: "We personally reach out to top matches, validate interest, motivation, salary expectations, and availability through real conversations." },
    s3: { title: "Ready-to-interview candidates", desc: "You receive only interested, qualified candidates with detailed AI scoring. Review profiles, give feedback, and interview — all from your portal." },
  },
  platform: {
    label: "The platform",
    title: "Your unfair advantage in hiring.",
    subtitle: "A dedicated portal where you track candidates, review AI scores, and manage your entire hiring pipeline.",
    tabs: ["Candidates", "AI Scoring", "Insights"],
    f1: {
      title: "Pre-screened candidates delivered to you",
      desc: "Every candidate in your portal has been found by AI, contacted by our team, and has confirmed interest in your role.",
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
    b4: { title: "Available globally", desc: "We find talent worldwide. Our platform supports English, French, and Spanish." },
  },
  pricing: {
    title: "Simple pricing. Powerful results.",
    subtitle: "Predictable monthly fee. No hidden costs. Cancel anytime.",
    popular: "Most popular",
    mo: "mo",
    cta: "Book a demo",
    note: "Sales-led onboarding. No setup fees. Cancel anytime after the first month.",
    s1desc: "For teams hiring 1-2 roles",
    s2desc: "For growing companies",
    s3desc: "For high-volume hiring",
    s1f: ["1 active position", "Pre-screened candidates weekly", "AI scoring on 10 criteria", "Client portal access", "Weekly reports", "Email support"],
    s2f: ["Up to 4 active positions", "Priority candidate delivery", "AI scoring on 10 criteria", "Client portal + analytics", "Weekly reports + AI insights", "Dedicated account manager"],
    s3f: ["5+ active positions", "Premium candidate delivery", "Custom AI scoring criteria", "Full analytics dashboard", "Phone qualification included", "Custom reporting + SLA"],
  },
  cta: {
    title: "Ready to transform your hiring?",
    subtitle: "Book a 30-min discovery call. We'll understand your needs and show you exactly how we'd deliver candidates for your team.",
    button: "Book a demo",
  },
  compare: {
    label: "The comparison",
    title: "Why teams choose Aimio over the alternatives.",
    subtitle: "Every option has trade-offs. Here's how we stack up against what you're probably doing today.",
    dimension: "Dimension",
    c1: "Job Posting",
    c2: "Internal Recruiter",
    c3: "Traditional Agency",
    c4: "Aimio",
    rows: [
      { label: "Candidate reach", v1: "5% (active seekers only)", v2: "LinkedIn network only", v3: "Agency database", v4: "100% (active + passive)" },
      { label: "Who does the work", v1: "You filter 100+ applications", v2: "1 internal hire", v3: "Agency contacts some", v4: "AI finds + seasoned recruiters qualify" },
      { label: "Candidate quality", v1: "Self-selected, unscreened", v2: "Varies by recruiter", v3: "Whoever they have", v4: "AI-scored + human-verified" },
      { label: "First delivery", v1: "Months", v2: "2-8 weeks", v3: "1-4 weeks", v4: "5-7 days" },
      { label: "Annual cost", v1: "$10K ads + your time", v2: "$117K (salary + benefits + tools)", v3: "$100-200K (5-10 hires)", v4: "$36-120K flat (any volume)" },
      { label: "Guarantee", v1: "None", v2: "None", v3: "90-day replacement", v4: "30-day full refund" },
    ],
  },
  guarantee: {
    label: "The guarantee",
    title: "30-day qualified candidate guarantee.",
    desc: "If we don't deliver qualified candidates within 30 days, you get a full refund. No fine print. That's how confident we are.",
    points: [
      "Qualified = contacted, scored, verified interest + availability",
      "Full refund if promise not met in 30 days",
      "Cancel anytime after month 1 — no annual lock-in",
      "Portal access + data exports yours to keep",
    ],
    roi_label: "ROI Math",
    roi_title: "Aimio vs. an internal recruiter.",
    roi_internal: "Internal recruiter (salary + benefits + tools)",
    roi_aimio: "Aimio Pro ($2,999/mo)",
    roi_save: "You save",
    roi_note: "Based on avg. $90K salary + 25% benefits + $5K tools. Your mileage may vary.",
  },
};

const fr = {
  nav: { how: "Fonctionnement", platform: "Plateforme", pricing: "Tarifs", cta: "R\u00e9server un appel" },
  hero: {
    badge: "Le futur du recrutement est ici",
    line1: "Recrutez mieux.",
    line2: "Plus vite. Moins cher.",
    subtitle: "Le futur du recrutement est ici. Votre \u00e9quipe de recrutement IA vous livre des talents qualifi\u00e9s et pr\u00e9-filtr\u00e9s en quelques jours.",
    cta: "R\u00e9server une d\u00e9mo",
    demo: "Voir la plateforme",
  },
  values: [
    { title: "Talents pr\u00e9-qualifi\u00e9s", desc: "Chaque candidat a \u00e9t\u00e9 contact\u00e9, \u00e9valu\u00e9 et a confirm\u00e9 son int\u00e9r\u00eat pour votre poste." },
    { title: "Pr\u00e9cision propuls\u00e9e par l\u2019IA", desc: "Scoring sur 10 crit\u00e8res personnalis\u00e9s. Forces et points d\u2019attention en un coup d\u2019\u0153il." },
    { title: "Votre portail d\u00e9di\u00e9", desc: "Suivez les candidats, consultez les scores et g\u00e9rez votre pipeline \u2014 au m\u00eame endroit." },
  ],
  how: {
    label: "Comment \u00e7a marche",
    title: "Trois \u00e9tapes vers votre prochaine embauche",
    s1: { title: "Recherche de talents propuls\u00e9e par l\u2019IA", desc: "Notre IA scanne le march\u00e9 en continu sur 50+ plateformes pour identifier les meilleurs candidats passifs pour vos postes ouverts." },
    s2: { title: "Qualification humaine", desc: "On contacte personnellement les meilleurs profils, on valide l\u2019int\u00e9r\u00eat, la motivation, les attentes salariales et la disponibilit\u00e9." },
    s3: { title: "Candidats pr\u00eats \u00e0 interviewer", desc: "Vous recevez uniquement des candidats int\u00e9ress\u00e9s et qualifi\u00e9s avec un scoring IA d\u00e9taill\u00e9. Le tout dans votre portail." },
  },
  platform: {
    label: "La plateforme",
    title: "Votre avantage comp\u00e9titif en recrutement.",
    subtitle: "Un portail d\u00e9di\u00e9 o\u00f9 vous suivez les candidats, consultez les scores IA et g\u00e9rez votre pipeline.",
    tabs: ["Candidats", "Scoring IA", "Intelligence"],
    f1: {
      title: "Candidats pr\u00e9-qualifi\u00e9s livr\u00e9s chez vous",
      desc: "Chaque candidat dans votre portail a \u00e9t\u00e9 sourc\u00e9 par l\u2019IA, contact\u00e9 par notre \u00e9quipe et a confirm\u00e9 son int\u00e9r\u00eat.",
      points: ["Uniquement des candidats int\u00e9ress\u00e9s", "Historique de carri\u00e8re et notes de motivation", "Mises \u00e0 jour en temps r\u00e9el"],
    },
    f2: {
      title: "Scoring IA sur 10 crit\u00e8res personnalis\u00e9s",
      desc: "Chaque candidat est scor\u00e9 automatiquement par notre IA selon des crit\u00e8res adapt\u00e9s \u00e0 votre poste.",
      points: ["10 crit\u00e8res pond\u00e9r\u00e9s par poste", "Visualisation du scoring en un coup d\u2019\u0153il", "Forces et points d\u2019attention identifi\u00e9s"],
    },
    f3: {
      title: "Intelligence de march\u00e9 pour mieux d\u00e9cider",
      desc: "Des insights hebdomadaires g\u00e9n\u00e9r\u00e9s par l\u2019IA pour un avantage comp\u00e9titif dans vos d\u00e9cisions.",
      points: ["Benchmarks salariaux pour votre march\u00e9", "Analyse de disponibilit\u00e9 des candidats", "Recommandations actionnables"],
    },
  },
  benefits: {
    b1: { title: "Plus rapide que le recrutement traditionnel", desc: "Notre IA travaille 24/7. Vous recevez vos premiers candidats qualifi\u00e9s en quelques jours." },
    b2: { title: "Pr\u00e9-qualifi\u00e9s et int\u00e9ress\u00e9s", desc: "Chaque candidat a \u00e9t\u00e9 contact\u00e9 personnellement et a confirm\u00e9 son int\u00e9r\u00eat. Z\u00e9ro entrevue gaspill\u00e9e." },
    b3: { title: "D\u00e9cisions bas\u00e9es sur les donn\u00e9es", desc: "Scoring IA, benchmarks de march\u00e9 et insights hebdomadaires pour plus de clart\u00e9." },
    b4: { title: "Disponible mondialement", desc: "On trouve des talents partout. Notre plateforme supporte l\u2019anglais, le fran\u00e7ais et l\u2019espagnol." },
  },
  pricing: {
    title: "Tarification simple. R\u00e9sultats puissants.",
    subtitle: "Forfait mensuel pr\u00e9visible. Aucun frais cach\u00e9. Annulez en tout temps.",
    popular: "Le plus populaire",
    mo: "mois",
    cta: "R\u00e9server une d\u00e9mo",
    note: "Onboarding accompagn\u00e9. Aucun frais de setup. Annulez apr\u00e8s le 1er mois.",
    s1desc: "Pour les \u00e9quipes qui recrutent 1-2 postes",
    s2desc: "Pour les entreprises en croissance",
    s3desc: "Pour le recrutement \u00e0 haut volume",
    s1f: ["1 poste actif", "Candidats pr\u00e9-qualifi\u00e9s chaque semaine", "Scoring IA sur 10 crit\u00e8res", "Acc\u00e8s au portail client", "Rapports hebdomadaires", "Support par courriel"],
    s2f: ["Jusqu\u2019\u00e0 4 postes actifs", "Livraison prioritaire", "Scoring IA sur 10 crit\u00e8res", "Portail + analytique", "Rapports + intelligence IA", "Gestionnaire de compte d\u00e9di\u00e9"],
    s3f: ["5+ postes actifs", "Livraison premium", "Crit\u00e8res IA personnalis\u00e9s", "Dashboard analytique complet", "Pr\u00e9-qualification t\u00e9l\u00e9phonique incluse", "Rapports personnalis\u00e9s + SLA"],
  },
  cta: {
    title: "Pr\u00eat \u00e0 transformer votre recrutement?",
    subtitle: "R\u00e9servez un appel de d\u00e9couverte de 30 min. On comprend vos besoins et on vous montre comment livrer vos candidats.",
    button: "R\u00e9server une d\u00e9mo",
  },
  compare: {
    label: "La comparaison",
    title: "Pourquoi les \u00e9quipes choisissent Aimio.",
    subtitle: "Chaque option a ses compromis. Voici comment on se compare \u00e0 ce que vous faites probablement aujourd\u2019hui.",
    dimension: "Dimension",
    c1: "Affichage de poste",
    c2: "Recruteur interne",
    c3: "Agence classique",
    c4: "Aimio",
    rows: [
      { label: "Port\u00e9e du march\u00e9", v1: "5% (candidats actifs seulement)", v2: "R\u00e9seau LinkedIn", v3: "Base de donn\u00e9es de l\u2019agence", v4: "100% (actifs + passifs)" },
      { label: "Qui fait le travail", v1: "Vous filtrez 100+ applications", v2: "1 embauche interne", v3: "Agence contacte quelques profils", v4: "IA trouve + recruteurs s\u00e9niors qualifient" },
      { label: "Qualit\u00e9 candidat", v1: "Auto-s\u00e9lectionn\u00e9s, non filtr\u00e9s", v2: "D\u00e9pend du recruteur", v3: "Qui ils ont", v4: "Scor\u00e9 IA + v\u00e9rifi\u00e9 humain" },
      { label: "Premi\u00e8re livraison", v1: "Des mois", v2: "2-8 semaines", v3: "1-4 semaines", v4: "5-7 jours" },
      { label: "Co\u00fbt mensuel", v1: "300-800$ d\u2019annonces + temps", v2: "9 500$/mois + b\u00e9n\u00e9fices", v3: "15-30K$ par placement", v4: "1 999-4 999$/mois forfait" },
      { label: "Garantie", v1: "Aucune", v2: "Aucune", v3: "Remplacement 90 jours", v4: "Remboursement 30 jours" },
    ],
  },
  guarantee: {
    label: "La garantie",
    title: "Garantie 30 jours sur les candidats qualifi\u00e9s.",
    desc: "Si on ne livre pas de candidats qualifi\u00e9s en 30 jours, remboursement complet. Aucun fine print. C\u2019est comme \u00e7a qu\u2019on est confiants.",
    points: [
      "Qualifi\u00e9 = contact\u00e9, scor\u00e9, int\u00e9r\u00eat + dispo v\u00e9rifi\u00e9s",
      "Remboursement complet si promesse non tenue en 30 jours",
      "Annulez en tout temps apr\u00e8s le 1er mois \u2014 aucun engagement annuel",
      "Acc\u00e8s portail + exports de donn\u00e9es \u00e0 vous pour toujours",
    ],
    roi_label: "Calcul ROI",
    roi_title: "Aimio vs. un recruteur interne.",
    roi_internal: "Recruteur interne (salaire + b\u00e9n\u00e9fices + outils)",
    roi_aimio: "Aimio Pro (2 999$/mois)",
    roi_save: "Vous \u00e9conomisez",
    roi_note: "Bas\u00e9 sur salaire moyen 90K$ + 25% b\u00e9n\u00e9fices + 5K$ outils. Les r\u00e9sultats varient.",
  },
};
