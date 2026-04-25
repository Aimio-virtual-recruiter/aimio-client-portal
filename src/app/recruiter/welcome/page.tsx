"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Supabase puts the invitation token in the URL hash — exchange it for a session
    const supabase = createSupabaseBrowserClient();

    const init = async () => {
      // Check for existing session
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || null);
        setAuthReady(true);

        // Pre-fill name from metadata
        const firstNameMeta = user.user_metadata?.first_name;
        if (firstNameMeta) setFirstName(firstNameMeta);
      } else {
        setError("Invalid or expired invitation link. Please ask your admin to re-send.");
        setAuthReady(true);
      }
    };

    init();
  }, [searchParams]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: firstName ? { first_name: firstName } : undefined,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Update profile + mark invitation accepted
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            first_name: firstName || undefined,
            invitation_accepted_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/recruiter");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-[24px] font-bold text-zinc-900 mb-2">Welcome to Aimio</h1>
          <p className="text-[14px] text-zinc-500 mb-6">
            Your password is set. Redirecting to your dashboard...
          </p>
          <Loader2 className="animate-spin text-zinc-400 mx-auto" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-zinc-200 shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/aimio-logo.png"
            alt="Aimio"
            width={80}
            height={24}
            priority
            className="h-6 w-auto"
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Recruiter onboarding
          </span>
        </div>

        <h1 className="text-[22px] font-bold text-zinc-900 mb-2 tracking-tight">
          Welcome to the team!
        </h1>
        {userEmail ? (
          <p className="text-[13px] text-zinc-500 mb-6">
            You&apos;ve been invited to join Aimio as a recruiter. Set your password below to
            activate your account.
            <br />
            <span className="text-zinc-700 font-semibold">{userEmail}</span>
          </p>
        ) : (
          <p className="text-[13px] text-red-600 mb-6">
            {error || "Invalid invitation link"}
          </p>
        )}

        {userEmail && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Anne-Marie"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white focus:border-[#2445EB] focus:ring-2 focus:ring-[#2445EB]/10 outline-none text-[14px]"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2 block">
                Create password (min 8 chars)
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full py-3 bg-[#2445EB] hover:bg-[#1A36C4] text-white rounded-lg text-[13px] font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#2445EB]/20"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  Activate my account <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-[11px] text-zinc-400 text-center mt-6">
          Already activated?{" "}
          <Link href="/login" className="text-[#2445EB] font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={24} />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
