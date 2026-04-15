"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Search, MessageSquare, UserCheck, BarChart3, Shield, Zap, Globe, Clock, DollarSign, Users, Star, ChevronRight, Sparkles, Play } from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [activeDemo, setActiveDemo] = useState(0);

  const t = lang === "en" ? en : fr;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-zinc-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Image src="/aimio-logo.png" alt="Aimio" width={100} height={30} />
          <div className="flex items-center gap-6">
            <a href="#how" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-premium">{t.nav.how}</a>
            <a href="#demo" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-premium">{t.nav.demo}</a>
            <a href="#pricing" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-premium">{t.nav.pricing}</a>
            <button
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="text-[12px] text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-md px-2 py-1 transition-premium"
            >
              {lang === "en" ? "FR" : "EN"}
            </button>
            <a href="/login" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-premium">{t.nav.login}</a>
            <a href="#pricing" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-[13px] font-medium hover:bg-zinc-800 transition-premium btn-press">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6C2BD9]/5 rounded-full mb-6">
            <Sparkles size={13} className="text-[#6C2BD9]" />
            <span className="text-[12px] font-medium text-[#6C2BD9]">{t.hero.badge}</span>
          </div>
          <h1 className="text-[48px] font-semibold text-zinc-900 tracking-tight leading-[1.1] mb-6">
            {t.hero.title1}<br />
            <span className="text-zinc-300">{t.hero.title2}</span>
          </h1>
          <p className="text-[18px] text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="#pricing" className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 transition-premium btn-press flex items-center gap-2">
              {t.hero.cta} <ArrowRight size={15} />
            </a>
            <a href="#demo" className="px-6 py-3 bg-zinc-50 text-zinc-700 rounded-xl text-[14px] font-medium hover:bg-zinc-100 transition-premium btn-press flex items-center gap-2 border border-zinc-200">
              <Play size={14} /> {t.hero.demo}
            </a>
          </div>
          <p className="text-[12px] text-zinc-400 mt-4">{t.hero.noCommission}</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 gap-6 text-center">
            {[
              { value: "100+", label: t.proof.clients },
              { value: "10", label: t.proof.candidates },
              { value: "3x", label: t.proof.faster },
              { value: "48h", label: t.proof.commission },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[28px] font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
                <p className="text-[12px] text-zinc-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="label text-[#6C2BD9] mb-3">{t.how.label}</p>
            <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight">{t.how.title}</h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: Search, title: t.how.step1.title, desc: t.how.step1.desc, num: "01" },
              { icon: MessageSquare, title: t.how.step2.title, desc: t.how.step2.desc, num: "02" },
              { icon: UserCheck, title: t.how.step3.title, desc: t.how.step3.desc, num: "03" },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-8 border border-zinc-200 shadow-card hover:shadow-card-hover transition-premium">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <step.icon size={18} className="text-white" />
                  </div>
                  <span className="text-[32px] font-bold text-zinc-100">{step.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="label text-[#6C2BD9] mb-3">{t.demo.label}</p>
            <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight">{t.demo.title}</h2>
            <p className="text-[15px] text-zinc-500 mt-3">{t.demo.subtitle}</p>
          </div>

          {/* Demo Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {t.demo.tabs.map((tab: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveDemo(i)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-premium ${
                  activeDemo === i ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Demo Content */}
          <div className="bg-zinc-900 rounded-2xl p-2 shadow-elevated">
            <div className="bg-zinc-50 rounded-xl overflow-hidden">
              {activeDemo === 0 && (
                <div className="p-8">
                  <div className="flex gap-6">
                    {/* Mini sidebar */}
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-6 h-6 bg-[#6C2BD9] rounded-md flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">iii</span>
                        </div>
                        <span className="text-[12px] font-semibold text-zinc-900">Aimio</span>
                      </div>
                      {["Dashboard", t.demo.mandates, t.demo.analytics, t.demo.reports].map((item, i) => (
                        <div key={i} className={`px-3 py-1.5 rounded-md text-[11px] mb-0.5 ${i === 0 ? "bg-zinc-200 font-medium text-zinc-900" : "text-zinc-400"}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Dashboard preview */}
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-zinc-900 mb-4">{t.demo.greeting}</p>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { v: "3", l: t.demo.activeM },
                          { v: "25", l: t.demo.delivered },
                          { v: "8", l: t.demo.interested },
                          { v: "3", l: t.demo.interviews },
                        ].map((s) => (
                          <div key={s.l} className="bg-white rounded-lg p-3 border border-zinc-100">
                            <p className="text-[16px] font-semibold text-zinc-900">{s.v}</p>
                            <p className="text-[9px] text-zinc-400">{s.l}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg border border-zinc-100 p-3">
                        <p className="text-[10px] font-medium text-zinc-500 mb-2">{t.demo.recentCandidates}</p>
                        {["Sophie Lavoie — 9.5/10", "Marie-Claude Gagnon — 9.2/10", "Jean-Francois Tremblay — 8.7/10"].map((c) => (
                          <div key={c} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                            <span className="text-[11px] text-zinc-700">{c.split(" — ")[0]}</span>
                            <span className="text-[11px] font-semibold text-[#6C2BD9]">{c.split(" — ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemo === 1 && (
                <div className="p-8">
                  <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                        <span className="text-[14px] font-semibold text-zinc-600">SL</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-zinc-900">Sophie Lavoie</p>
                        <p className="text-[11px] text-zinc-400">Director of Estimation — 15 years experience</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[24px] font-bold text-[#6C2BD9]">9.5</p>
                        <p className="text-[9px] text-zinc-400">/10</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {[
                        { l: "Relevant experience", s: 10 },
                        { l: "Technical skills", s: 10 },
                        { l: "Bilingualism", s: 9 },
                        { l: "Location", s: 9 },
                        { l: "Salary fit", s: 6 },
                      ].map((item) => (
                        <div key={item.l} className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-400 w-28 shrink-0">{item.l}</span>
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full">
                            <div className="h-full rounded-full bg-[#6C2BD9]" style={{ width: `${item.s * 10}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-600 w-5 text-right">{item.s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[11px] font-medium">{t.demo.interestedBtn}</button>
                      <button className="flex-1 py-2 bg-zinc-100 text-zinc-500 rounded-lg text-[11px] font-medium">{t.demo.notInterestedBtn}</button>
                    </div>
                  </div>
                </div>
              )}

              {activeDemo === 2 && (
                <div className="p-8">
                  <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={14} className="text-[#6C2BD9]" />
                      <p className="text-[12px] font-semibold text-zinc-900">{t.demo.aiInsights}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-zinc-100 text-center">
                        <p className="text-[18px] font-semibold text-zinc-900">247</p>
                        <p className="text-[9px] text-zinc-400">{t.demo.sourced}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-zinc-100 text-center">
                        <p className="text-[18px] font-semibold text-zinc-900">48</p>
                        <p className="text-[9px] text-zinc-400">{t.demo.approached}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-zinc-100 text-center">
                        <p className="text-[18px] font-semibold text-[#6C2BD9]">5</p>
                        <p className="text-[9px] text-zinc-400">{t.demo.deliveredW}</p>
                      </div>
                    </div>
                    <div className="bg-[#6C2BD9]/5 rounded-lg p-4 border border-[#6C2BD9]/10">
                      <p className="text-[10px] text-[#6C2BD9] font-medium uppercase tracking-wider mb-1">{t.demo.aiRec}</p>
                      <p className="text-[12px] text-zinc-700 leading-relaxed">{t.demo.aiRecText}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight">{t.benefits.title}</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: t.benefits.b1.title, desc: t.benefits.b1.desc },
              { icon: Clock, title: t.benefits.b2.title, desc: t.benefits.b2.desc },
              { icon: Zap, title: t.benefits.b3.title, desc: t.benefits.b3.desc },
              { icon: Shield, title: t.benefits.b4.title, desc: t.benefits.b4.desc },
              { icon: BarChart3, title: t.benefits.b5.title, desc: t.benefits.b5.desc },
              { icon: Globe, title: t.benefits.b6.title, desc: t.benefits.b6.desc },
            ].map((b) => (
              <div key={b.title} className="p-6">
                <b.icon size={20} className="text-[#6C2BD9] mb-3" strokeWidth={1.5} />
                <h3 className="text-[14px] font-semibold text-zinc-900 mb-1.5">{b.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight">{t.compare.title}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-card overflow-hidden">
            <div className="grid grid-cols-4 text-center">
              <div className="p-4 border-b border-r border-zinc-100"></div>
              <div className="p-4 border-b border-r border-zinc-100 text-[12px] font-medium text-zinc-500">{t.compare.agency}</div>
              <div className="p-4 border-b border-r border-zinc-100 text-[12px] font-medium text-zinc-500">{t.compare.internal}</div>
              <div className="p-4 border-b border-zinc-100 bg-[#6C2BD9]/5">
                <span className="text-[12px] font-semibold text-[#6C2BD9]">Aimio AI</span>
              </div>
            </div>
            {[
              { label: t.compare.cost5, agency: "$80,000", internal: "$85,000/yr", aimio: "$36,000/yr" },
              { label: t.compare.time, agency: "4-8 wks", internal: "Variable", aimio: "2-3 wks" },
              { label: t.compare.ai, agency: "—", internal: "—", aimio: "✓" },
              { label: t.compare.commitment, agency: t.compare.perHire, internal: t.compare.fullTime, aimio: t.compare.monthly },
              { label: t.compare.candidates, agency: "3-5", internal: "Variable", aimio: "15-25/wk" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-4 text-center border-b border-zinc-50 last:border-0">
                <div className="p-3 border-r border-zinc-100 text-[12px] text-zinc-500 text-left pl-6">{row.label}</div>
                <div className="p-3 border-r border-zinc-100 text-[12px] text-zinc-600">{row.agency}</div>
                <div className="p-3 border-r border-zinc-100 text-[12px] text-zinc-600">{row.internal}</div>
                <div className="p-3 bg-[#6C2BD9]/[0.02] text-[12px] font-semibold text-zinc-900">{row.aimio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight">{t.pricing.title}</h2>
            <p className="text-[15px] text-zinc-500 mt-3">{t.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "1,499",
                positions: "2",
                features: t.pricing.starterFeatures,
                popular: false,
              },
              {
                name: "Pro",
                price: "2,999",
                positions: "5",
                features: t.pricing.proFeatures,
                popular: true,
              },
              {
                name: "Enterprise",
                price: "4,999",
                positions: "10+",
                features: t.pricing.enterpriseFeatures,
                popular: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border shadow-card relative ${plan.popular ? "border-[#6C2BD9] shadow-lg" : "border-zinc-200"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#6C2BD9] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                    {t.pricing.popular}
                  </div>
                )}
                <p className="text-[13px] font-semibold text-zinc-900 mb-1">{plan.name}</p>
                <p className="text-[11px] text-zinc-400 mb-4">{plan.positions} {t.pricing.positions}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[36px] font-semibold text-zinc-900 tracking-tight">${plan.price}</span>
                  <span className="text-[13px] text-zinc-400">/{t.pricing.month}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-zinc-600">
                      <Check size={14} className="text-[#6C2BD9] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`w-full py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-premium btn-press ${
                    plan.popular
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {t.pricing.cta} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-zinc-400 mt-6">{t.pricing.noCommitment}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[32px] font-semibold text-zinc-900 tracking-tight mb-4">{t.cta.title}</h2>
          <p className="text-[15px] text-zinc-500 mb-8">{t.cta.subtitle}</p>
          <a href="#" className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-xl text-[15px] font-medium hover:bg-zinc-800 transition-premium btn-press">
            {t.cta.button} <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6C2BD9] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[8px] tracking-wider">iii</span>
            </div>
            <span className="text-[13px] text-zinc-400">© 2026 Aimio Recrutement Inc.</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-zinc-400">
            <a href="#" className="hover:text-zinc-600 transition-premium">Privacy</a>
            <a href="#" className="hover:text-zinc-600 transition-premium">Terms</a>
            <a href="mailto:marcantoine.cote@aimiorecrutement.com" className="hover:text-zinc-600 transition-premium">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// TRANSLATIONS
const en = {
  nav: { how: "How it works", demo: "Demo", pricing: "Pricing", login: "Client login", cta: "Get started" },
  hero: {
    badge: "AI-Powered Recruitment",
    title1: "Your AI recruiting team.",
    title2: "On demand.",
    subtitle: "Our AI sources, contacts, and qualifies candidates for you. You receive pre-screened, interested candidates every week — ready to interview. Hire faster. Hire smarter.",
    cta: "Get 5 free candidates",
    demo: "See it in action",
    noCommission: "No long-term commitment. Cancel anytime.",
  },
  proof: { clients: "Clients served", candidates: "Criteria AI scoring", faster: "Faster time-to-hire", commission: "First candidates delivered" },
  how: {
    label: "How it works",
    title: "From job opening to hire in 3 steps",
    step1: { title: "We source with AI", desc: "Our AI scans multiple platforms simultaneously to find the best passive candidates for your role. We review hundreds of profiles daily." },
    step2: { title: "We contact & qualify", desc: "We reach out to top matches, qualify their interest, motivation, and salary expectations through a personal conversation." },
    step3: { title: "You interview & hire", desc: "You receive only interested, qualified candidates with detailed AI scoring. Interview who you want. Hire directly. It's that simple." },
  },
  demo: {
    label: "See it in action",
    title: "Your client portal",
    subtitle: "This is what you get when you subscribe to Aimio AI Recruiter",
    tabs: ["Dashboard", "Candidate profile", "AI insights"],
    mandates: "Mandates",
    analytics: "Analytics",
    reports: "Reports",
    greeting: "Hello, Terri",
    activeM: "Active mandates",
    delivered: "Candidates delivered",
    interested: "Interested",
    interviews: "Interviews scheduled",
    recentCandidates: "Latest candidates delivered",
    interestedBtn: "Interested — Schedule interview",
    notInterestedBtn: "Not interested",
    aiInsights: "AI Weekly Insights",
    sourced: "Profiles sourced",
    approached: "Candidates approached",
    deliveredW: "Delivered this week",
    aiRec: "AI Recommendation",
    aiRecText: "To improve your conversion rate, we recommend adjusting the salary range to $95-105K and offering 2 days in office instead of 3. This would increase your qualified candidate pool by ~40%.",
  },
  benefits: {
    title: "Why companies choose Aimio",
    b1: { title: "Predictable pricing", desc: "Simple flat monthly fee. Budget your recruiting costs with confidence. No surprises." },
    b2: { title: "2-3 weeks average", desc: "Our AI works 24/7 scanning the market. You receive your first candidates within 48 hours." },
    b3: { title: "AI-powered scoring", desc: "Every candidate is scored on 10 criteria by our AI. You see strengths, concerns, and motivation at a glance." },
    b4: { title: "Pre-qualified candidates", desc: "We only deliver candidates who are interested and have been personally qualified by our team." },
    b5: { title: "Market intelligence", desc: "Weekly reports with salary benchmarks, market availability, and actionable recommendations." },
    b6: { title: "Available worldwide", desc: "We source candidates globally. Our platform supports English, French, and Spanish." },
  },
  compare: {
    title: "How we compare",
    agency: "Traditional agency",
    internal: "Internal recruiter",
    cost5: "Cost for 5 hires (80K avg)",
    time: "Time to fill",
    ai: "AI-powered scoring",
    commitment: "Commitment",
    candidates: "Candidates per position",
    perHire: "Per hire",
    fullTime: "Full-time salary",
    monthly: "Month-to-month",
  },
  pricing: {
    title: "Simple, transparent pricing",
    subtitle: "Simple flat fee. No hidden costs. Cancel anytime.",
    popular: "Most popular",
    positions: "active positions",
    month: "mo",
    cta: "Get started",
    noCommitment: "No commitment. No setup fees. Cancel anytime.",
    starterFeatures: [
      "Up to 2 active positions",
      "10-15 qualified candidates/week",
      "AI scoring on 10 criteria",
      "Client portal access",
      "Weekly market reports",
      "Email support",
    ],
    proFeatures: [
      "Up to 5 active positions",
      "15-25 qualified candidates/week",
      "AI scoring on 10 criteria",
      "Client portal access",
      "Weekly market reports + AI insights",
      "Priority support",
      "Dedicated account manager",
    ],
    enterpriseFeatures: [
      "10+ active positions",
      "20+ qualified candidates/week",
      "AI scoring on custom criteria",
      "Client portal access",
      "Real-time analytics dashboard",
      "Dedicated account manager",
      "Phone qualification included",
      "Custom reporting",
    ],
  },
  cta: {
    title: "Ready to hire faster and smarter?",
    subtitle: "Get 5 qualified, interested candidates for free. No obligation. See the quality for yourself.",
    button: "Get 5 free candidates",
  },
};

const fr = {
  nav: { how: "Comment ca marche", demo: "Demo", pricing: "Tarifs", login: "Connexion client", cta: "Commencer" },
  hero: {
    badge: "Recrutement propulse par l'IA",
    title1: "Votre equipe de recrutement IA.",
    title2: "Sur demande.",
    subtitle: "Notre IA source, contacte et qualifie les candidats pour vous. Vous recevez des candidats qualifies et interesses chaque semaine — prets a interviewer. Recrutez plus vite. Recrutez mieux.",
    cta: "5 candidats gratuits",
    demo: "Voir en action",
    noCommission: "Aucun engagement a long terme. Annulez en tout temps.",
  },
  proof: { clients: "Clients servis", candidates: "Criteres de scoring IA", faster: "Recrutement accelere", commission: "Premiers candidats livres" },
  how: {
    label: "Comment ca marche",
    title: "Du poste ouvert a l'embauche en 3 etapes",
    step1: { title: "On source avec l'IA", desc: "Notre IA scanne plusieurs plateformes simultanement pour trouver les meilleurs candidats passifs. On analyse des centaines de profils par jour." },
    step2: { title: "On contacte et qualifie", desc: "On approche les meilleurs profils, on qualifie leur interet, motivation et attentes salariales lors d'une conversation personnelle." },
    step3: { title: "Vous interviewez et embauchez", desc: "Vous recevez uniquement des candidats interesses et qualifies avec un scoring IA detaille. Vous embauchez directement. C'est aussi simple que ca." },
  },
  demo: {
    label: "Voir en action",
    title: "Votre portail client",
    subtitle: "Voici ce que vous obtenez avec le Recruteur Virtuel IA d'Aimio",
    tabs: ["Dashboard", "Fiche candidat", "Intelligence IA"],
    mandates: "Mandats",
    analytics: "Analytique",
    reports: "Rapports",
    greeting: "Bonjour, Terri",
    activeM: "Mandats actifs",
    delivered: "Candidats livres",
    interested: "Interesses",
    interviews: "Entrevues planifiees",
    recentCandidates: "Derniers candidats livres",
    interestedBtn: "Interesse — Planifier entrevue",
    notInterestedBtn: "Pas interesse",
    aiInsights: "Intelligence IA hebdomadaire",
    sourced: "Profils sources",
    approached: "Candidats approches",
    deliveredW: "Livres cette semaine",
    aiRec: "Recommandation IA",
    aiRecText: "Pour ameliorer votre taux de conversion, nous recommandons d'ajuster la fourchette salariale a 95-105K$ et d'offrir 2 jours au bureau au lieu de 3. Cela augmenterait votre bassin de candidats de ~40%.",
  },
  benefits: {
    title: "Pourquoi les entreprises choisissent Aimio",
    b1: { title: "Tarification previsible", desc: "Forfait mensuel fixe et simple. Budgetez vos couts de recrutement en toute confiance." },
    b2: { title: "2-3 semaines en moyenne", desc: "Notre IA travaille 24/7. Vous recevez vos premiers candidats en 48 heures." },
    b3: { title: "Scoring IA", desc: "Chaque candidat est score sur 10 criteres par notre IA. Forces, faiblesses et motivation en un coup d'oeil." },
    b4: { title: "Candidats pre-qualifies", desc: "On livre uniquement des candidats interesses et personnellement qualifies par notre equipe." },
    b5: { title: "Intelligence de marche", desc: "Rapports hebdomadaires avec benchmarks salariaux, disponibilite du marche et recommandations." },
    b6: { title: "Disponible mondialement", desc: "On source des candidats partout. Notre plateforme supporte le francais, l'anglais et l'espagnol." },
  },
  compare: {
    title: "Comment on se compare",
    agency: "Agence traditionnelle",
    internal: "Recruteur interne",
    cost5: "Cout pour 5 embauches (80K$ moy)",
    time: "Delai moyen",
    ai: "Scoring IA",
    commitment: "Engagement",
    candidates: "Candidats par poste",
    perHire: "Par embauche",
    fullTime: "Salaire temps plein",
    monthly: "Mois par mois",
  },
  pricing: {
    title: "Tarification simple et transparente",
    subtitle: "Forfait simple. Aucun frais cache. Annulez en tout temps.",
    popular: "Le plus populaire",
    positions: "postes actifs",
    month: "mois",
    cta: "Commencer",
    noCommitment: "Aucun engagement. Aucun frais de setup. Annulez en tout temps.",
    starterFeatures: [
      "Jusqu'a 2 postes actifs",
      "10-15 candidats qualifies/semaine",
      "Scoring IA sur 10 criteres",
      "Acces au portail client",
      "Rapports hebdomadaires",
      "Support par courriel",
    ],
    proFeatures: [
      "Jusqu'a 5 postes actifs",
      "15-25 candidats qualifies/semaine",
      "Scoring IA sur 10 criteres",
      "Acces au portail client",
      "Rapports + intelligence IA",
      "Support prioritaire",
      "Gestionnaire de compte dedie",
    ],
    enterpriseFeatures: [
      "10+ postes actifs",
      "20+ candidats qualifies/semaine",
      "Scoring IA sur criteres personnalises",
      "Acces au portail client",
      "Dashboard analytique en temps reel",
      "Gestionnaire de compte dedie",
      "Pre-qualification telephonique incluse",
      "Rapports personnalises",
    ],
  },
  cta: {
    title: "Pret a recruter plus vite et mieux?",
    subtitle: "Recevez 5 candidats qualifies et interesses gratuitement. Aucune obligation. Jugez la qualite par vous-meme.",
    button: "5 candidats gratuits",
  },
};
