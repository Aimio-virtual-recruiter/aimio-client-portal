"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login/reset`
          : "https://hireaimio.com/login/reset";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
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
            Reset your password.
          </h1>
          <p className="text-[14px] text-zinc-400 leading-relaxed">
            We'll send you a secure link to set a new password.
          </p>
        </div>

        <p className="relative z-10 text-[11px] text-zinc-600">© 2026 Aimio Recrutement Inc.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[360px]">
          <div className="lg:hidden mb-8">
            <Image src="/aimio-logo.png" alt="Aimio" width={110} height={32} priority className="h-8 w-auto" />
          </div>

          <h2 className="text-[22px] font-semibold text-zinc-900 tracking-tight">
            {sent ? "Check your inbox" : "Forgot your password?"}
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1 mb-8">
            {sent
              ? `We sent a reset link to ${email}. Click it to choose a new password.`
              : "Enter your email and we'll send you a link to reset your password."}
          </p>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-2 mb-6">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-emerald-800 leading-relaxed">
                If you don't see it within 2 minutes, check your spam folder or try again with a different
                email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 bg-[#2445EB] hover:bg-[#1A36C4] text-white rounded-lg text-[13px] font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending link...
                  </>
                ) : (
                  <>
                    Send reset link <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft size={12} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
