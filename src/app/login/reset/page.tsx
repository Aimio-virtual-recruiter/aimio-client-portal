"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function ResetContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
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
            Set a new password.
          </h1>
          <p className="text-[14px] text-zinc-400 leading-relaxed">
            Choose something strong — at least 8 characters.
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
            {done ? "Password updated" : "New password"}
          </h2>
          <p className="text-[13px] text-zinc-500 mt-1 mb-8">
            {done
              ? "Redirecting you to sign in…"
              : "Enter and confirm your new password below."}
          </p>

          {hasSession === false && !done ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-[13px] text-amber-800 leading-relaxed">
                Reset link expired or invalid. Please request a new one.
              </p>
              <Link
                href="/login/forgot"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#2445EB] font-medium"
              >
                Request new link →
              </Link>
            </div>
          ) : done ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-2 mb-6">
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-emerald-800">All set. You can now sign in with your new password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none text-[14px]"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none text-[14px]"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                disabled={loading}
                className="w-full py-2.5 bg-[#2445EB] hover:bg-[#1A36C4] text-white rounded-lg text-[13px] font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    Update password <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900">
            <ArrowLeft size={12} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <ResetContent />
    </Suspense>
  );
}
