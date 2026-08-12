import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import SocialProof from "../components/SocialProof";
import ProblemSection from "../components/ProblemSection";
import FeaturesSection from "../components/FeaturesSection";
import InteractiveDemo from "../components/InteractiveDemo";
import DashboardShowcase from "../components/DashboardShowcase";
import ComparisonTable from "../components/ComparisonTable";
import HowItWorks from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Navigation ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main id="main-content">

        {/* 1. Hero */}
        <HeroSection />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 2. Social Proof — role chips */}
        <SocialProof />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 3. Problem Section */}
        <ProblemSection />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 4. Features */}
        <FeaturesSection />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 5. Interactive Demo */}
        <InteractiveDemo />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 6. Dashboard Showcase */}
        <DashboardShowcase />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 7. Comparison Table */}
        <ComparisonTable />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 8. How It Works */}
        <HowItWorks />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 9. FAQ */}
        <FAQ />

        {/* Divider */}
        <div className="divider-gradient max-w-7xl mx-auto" aria-hidden="true" />

        {/* 10. Final CTA */}
        <FinalCTA />

      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
