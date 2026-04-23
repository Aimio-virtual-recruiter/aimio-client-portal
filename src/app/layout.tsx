import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hireaimio.com"),
  title: {
    default: "Aimio Recruteur Virtuel IA | AI + Seasoned Recruiters, Delivered as a Service",
    template: "%s | Aimio",
  },
  description: "15-25 pre-qualified candidates delivered monthly by AI + seasoned recruiters (5-15 years of experience). First shortlist in 5-7 days. 30-day qualified candidate guarantee. For growing companies in the USA, Canada, UK, Ireland, Australia.",
  keywords: [
    "AI recruiting service",
    "recruiter as a service",
    "flat fee recruiting",
    "AI sourcing",
    "alternative to internal recruiter",
    "alternative to recruiting agency",
    "Moonhub alternative",
    "Paraform alternative",
    "Fetcher alternative",
    "recruitment as a service",
    "Aimio Recruteur Virtuel",
    "bilingual recruiting",
  ],
  authors: [{ name: "Aimio Recrutement", url: "https://hireaimio.com" }],
  creator: "Aimio Recrutement Inc.",
  publisher: "Aimio Recrutement Inc.",
  icons: { icon: "/aimio-logo.png", apple: "/aimio-logo.png" },
  alternates: {
    canonical: "/",
    languages: { "en-US": "/", "fr-CA": "/?lang=fr" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_CA"],
    url: "https://hireaimio.com",
    siteName: "Aimio Recruteur Virtuel IA",
    title: "Aimio Recruteur Virtuel IA | AI + Seasoned Recruiters",
    description: "15-25 pre-qualified candidates delivered monthly. First shortlist in 5-7 days. 30-day guarantee.",
    images: [{ url: "/aimio-logo.png", width: 1200, height: 630, alt: "Aimio Recruteur Virtuel IA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aimio Recruteur Virtuel IA",
    description: "AI + Seasoned Recruiters. Delivered as a service.",
    images: ["/aimio-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

// ================ SCHEMA.ORG ================

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://hireaimio.com/#organization",
  "name": "Aimio Recruteur Virtuel IA",
  "alternateName": ["Aimio", "Aimio Recrutement"],
  "url": "https://hireaimio.com",
  "logo": "https://hireaimio.com/aimio-logo.png",
  "description": "AI + Seasoned Recruiters. Delivered as a service. 15-25 pre-qualified candidates delivered monthly. First shortlist in 5-7 days. 30-day qualified candidate guarantee.",
  "foundingDate": "2015",
  "founder": { "@type": "Person", "name": "Marc-Antoine Côté", "jobTitle": "Founder & CEO" },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2201-1020 rue de Bleury",
    "addressLocality": "Montréal",
    "addressRegion": "QC",
    "postalCode": "H2Z 0B9",
    "addressCountry": "CA",
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@aimiorecrutement.com",
    "contactType": "sales",
    "areaServed": ["US", "CA", "GB", "IE", "AU"],
    "availableLanguage": ["English", "French"],
  },
  "sameAs": [
    "https://www.linkedin.com/company/aimio-recrutement",
    "https://aimiorecrutement.com",
  ],
  "areaServed": [
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "Ireland" },
    { "@type": "Country", "name": "Australia" },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://hireaimio.com/#service",
  "name": "Aimio Recruteur Virtuel IA",
  "serviceType": "Recruiting-as-a-Service",
  "provider": { "@id": "https://hireaimio.com/#organization" },
  "description": "AI + Human recruiting service delivering 15-25 pre-qualified candidates monthly. Combines AI sourcing (10+ platforms, 10-criteria scoring) with senior human recruiters (5-15 years experience) for personalized qualification.",
  "areaServed": [
    { "@type": "Country", "name": "United States" },
    { "@type": "Country", "name": "Canada" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "Ireland" },
    { "@type": "Country", "name": "Australia" },
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Aimio Pricing Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "Starter",
        "price": "1999",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "price": "1999", "priceCurrency": "USD", "billingIncrement": 1, "unitText": "MONTH" },
        "description": "Up to 2 active positions, 8-12 qualified candidates per month, AI scoring, client portal, weekly reports, email support.",
      },
      {
        "@type": "Offer",
        "name": "Pro",
        "price": "2999",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "price": "2999", "priceCurrency": "USD", "billingIncrement": 1, "unitText": "MONTH" },
        "description": "Up to 5 active positions, 15-25 qualified candidates per month, priority delivery, dedicated account manager, phone qualification.",
      },
      {
        "@type": "Offer",
        "name": "Enterprise",
        "price": "4999",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "price": "4999", "priceCurrency": "USD", "billingIncrement": 1, "unitText": "MONTH" },
        "description": "10+ active positions, 30-40 qualified candidates per month, custom scoring criteria, SLA, custom reporting.",
      },
    ],
  },
  "termsOfService": "https://hireaimio.com/terms",
  "slogan": "AI + Seasoned Recruiters. Delivered as a service.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Aimio Recruteur Virtuel IA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aimio Recruteur Virtuel IA is a premium AI + Human recruiting service delivered as a monthly subscription. We deliver 15-25 pre-qualified, interested candidates per month to growing companies in the USA, Canada (outside Quebec), UK, Ireland, and Australia. AI sources candidates from 10+ platforms, senior human recruiters (5-15 years experience) qualify them personally, and you receive interview-ready candidates in your client portal.",
      },
    },
    {
      "@type": "Question",
      "name": "How much does Aimio cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aimio has three pricing tiers: Starter at $1,999 USD/month for up to 2 active positions (8-12 candidates/month), Pro at $2,999 USD/month for up to 5 positions (15-25 candidates/month), and Enterprise at $4,999 USD/month for 10+ positions (30-40 candidates/month). No setup fees, no contracts, cancel anytime after month 1.",
      },
    },
    {
      "@type": "Question",
      "name": "How fast can Aimio deliver candidates?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "First qualified shortlist delivered in 5-7 business days after kickoff. AI begins sourcing on day 1-3, human recruiters qualify in days 3-5, and your portal is populated with interview-ready candidates by day 5-7. Continuous delivery throughout the month for a total of 15-25 qualified candidates (Pro tier).",
      },
    },
    {
      "@type": "Question",
      "name": "What is Aimio's guarantee?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "30-day qualified candidate money-back guarantee. If we don't deliver qualified candidates within 30 days, you get a full refund. No fine print, no exceptions. A qualified candidate is one who has been sourced, AI-scored, contacted by a human recruiter, and verified for interest, availability, skills, and salary alignment.",
      },
    },
    {
      "@type": "Question",
      "name": "How is Aimio different from Moonhub, Paraform, or Fetcher?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Four key differentiators: (1) We commit to 15-25 candidates, not 'up to 25' like competitors. (2) 30-day full refund guarantee — no other service offers this. (3) Bilingual senior recruiters (English + French), based in Canada. (4) Founder-operator model: led by a 10-year recruiter, not a tech founder. Plus, we are 25-40% less expensive than Moonhub or Paraform at comparable tiers.",
      },
    },
    {
      "@type": "Question",
      "name": "Who are Aimio's seasoned recruiters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our human recruiting team consists of senior recruiters with 5-15 years of experience each, specialized in high-skilled placements across 11 sectors (tech, finance, construction, healthcare, etc.). Every recruiter is bilingual (English and French), based in North America, and trained on AI-augmented workflows.",
      },
    },
    {
      "@type": "Question",
      "name": "What is the ROI of Aimio vs hiring an internal recruiter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An internal recruiter costs approximately $117,500 per year (salary + benefits + tools like LinkedIn Recruiter). Aimio Pro costs $36,000 per year. You save $81,500 per year AND receive 180-300 qualified candidates instead of 15-30 hires from a single internal recruiter. That's 6x more volume at 31% the cost.",
      },
    },
    {
      "@type": "Question",
      "name": "Does Aimio serve companies in Quebec?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aimio Recruteur Virtuel IA is designed for companies outside Quebec. Our Quebec-based clients are served by our sister service, Aimio Recrutement (aimiorecrutement.com), which offers permanent placement and specialized Quebec market recruiting services.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hireaimio.com" },
    { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://hireaimio.com/#services" },
    { "@type": "ListItem", "position": 3, "name": "Pricing", "item": "https://hireaimio.com/#pricing" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8F7FF]">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
