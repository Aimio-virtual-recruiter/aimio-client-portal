import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aimio | AI-Powered Recruitment Platform",
  description: "Your AI recruiting team, on demand. We source, contact, and qualify candidates for you. Pre-screened, interested talent delivered weekly.",
  keywords: "AI recruitment, AI hiring, recruitment platform, talent sourcing, AI recruiter, hiring software",
  openGraph: {
    title: "Aimio | AI-Powered Recruitment Platform",
    description: "Your AI recruiting team, on demand. Pre-screened, interested candidates delivered weekly.",
    type: "website",
    locale: "en_US",
    siteName: "Aimio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aimio | AI-Powered Recruitment Platform",
    description: "Your AI recruiting team, on demand.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
