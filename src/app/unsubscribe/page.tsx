import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";

interface SearchParams {
  status?: string;
  email?: string;
  error?: string;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = params.status;
  const email = params.email;
  const error = params.error;

  const isSuccess = status === "ok";
  const hasError = !!error;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/aimio-logo.png"
            alt="Aimio"
            width={100}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </div>

        {isSuccess ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-900 mb-2">You&apos;re unsubscribed</h1>
            <p className="text-[13px] text-zinc-600 mb-1">
              {email ? (
                <>
                  We&apos;ve removed <strong>{email}</strong> from our mailing list.
                </>
              ) : (
                <>We&apos;ve removed your email from our mailing list.</>
              )}
            </p>
            <p className="text-[12px] text-zinc-500 mb-6">
              You won&apos;t receive any more marketing emails from Aimio.
              You may still receive transactional emails (e.g. account-related) if you have an active subscription.
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Changed your mind? Reply to any email from us and we&apos;ll happily add you back.
            </p>
          </div>
        ) : hasError ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={26} className="text-amber-600" />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-900 mb-2">Invalid request</h1>
            <p className="text-[13px] text-zinc-600 mb-6">
              {error === "invalid"
                ? "This unsubscribe link appears to be invalid or expired."
                : "Something went wrong on our end. Please try again."}
            </p>
            <p className="text-[12px] text-zinc-500 mb-6">
              To unsubscribe manually, send an email to{" "}
              <a
                href="mailto:unsubscribe@aimiorecrutement.com"
                className="text-[#2445EB] font-semibold underline"
              >
                unsubscribe@aimiorecrutement.com
              </a>{" "}
              with &quot;UNSUBSCRIBE&quot; in the subject line. We&apos;ll process within 24 hours.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={26} className="text-blue-600" />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-900 mb-2">Unsubscribe</h1>
            <p className="text-[13px] text-zinc-600 mb-6">
              To unsubscribe, please click the unsubscribe link in any email we&apos;ve sent you.
              <br />
              <br />
              Or email{" "}
              <a
                href="mailto:unsubscribe@aimiorecrutement.com"
                className="text-[#2445EB] font-semibold underline"
              >
                unsubscribe@aimiorecrutement.com
              </a>{" "}
              and we&apos;ll process within 24 hours.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <Link
            href="/"
            className="text-[12px] text-zinc-500 hover:text-zinc-900 transition"
          >
            ← Back to hireaimio.com
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Aimio Recrutement Inc.<br />
            2201-1020 rue de Bleury, Montreal, QC, H2Z 0B9, Canada
          </p>
        </div>
      </div>
    </div>
  );
}
