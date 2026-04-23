"use client";
import LandingPage from "./landing/page";

// Root of hireaimio.com = Landing RV
// Login moved to /login
// Landing also still accessible at /landing for backwards compatibility
export default function Home() {
  return <LandingPage />;
}
