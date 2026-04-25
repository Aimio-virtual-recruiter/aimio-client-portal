"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed — no user returned");
        setLoading(false);
        return;
      }

      // Fetch role to determine landing page
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || "client";

      // Redirect logic
      let destination = redirectTo;
      if (!destination) {
        if (role === "admin") destination = "/admin";
        else if (role === "recruiter") destination = "/recruiter";
        else destination = "/dashboard";
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-zinc-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2445EB]/20 via-transparent to-[#4B5DF5]/10" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#2445EB]/10 rounded-full blur-[100px]" />
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
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mt-2">
            Virtual Recruiter
          </p>
        </div>

        <div className="relative z-10">
          <h1 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-6">
            Hire smarter.{" "}
            <span className="text-zinc-500 italic">Faster. Cheaper.</span>
          </h1>
          <p className="text-[14px] text-zinc-400 leading-relaxed">
            AI-powered sourcing · Human-qualified candidates · Delivered weekly.
          </p>
        </div>

        <p className="relative z-10 text-[11px] text-zinc-600">
          © 2026 Aimio Recrutement Inc.
        </p>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Image
              src="/aimio-logo.png"
              alt="Aimio"
              width={110}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </div>

          <h2 className="text-[22px] font-semibold text-zinc-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1 mb-8">
            Sign in to your Aimio account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-300"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-300"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[12px] text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Link
                href="/login/forgot"
                className="text-[12px] text-[#2445EB] hover:text-[#1A36C4] font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[13px] font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] uppercase tracking-wider text-zinc-400 mt-8">
            Powered by Aimio · Virtual Recruiter
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <LoginContent />
    </Suspense>
  );
}
