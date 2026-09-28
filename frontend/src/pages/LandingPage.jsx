import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import RoleCardsSection from '../components/landing/RoleCardsSection';
import HighlightsBar from '../components/landing/HighlightsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import SmartInventoryFlow from '../components/landing/SmartInventoryFlow';
import BatchVisibilitySection from '../components/landing/BatchVisibilitySection';
import ExpiryManagementSection from '../components/landing/ExpiryManagementSection';
import DealerAutomationSection from '../components/landing/DealerAutomationSection';
import AiIntelligenceSection from '../components/landing/AiIntelligenceSection';
import AnalyticsSection from '../components/landing/AnalyticsSection';
import SecurityAccessSection from '../components/landing/SecurityAccessSection';
import AboutSection from '../components/landing/AboutSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-500 selection:text-white font-sans overflow-x-hidden">
      {/* 1. Sticky Modern SaaS Navigation Bar */}
      <LandingNavbar />

      <main>
        {/* 2. Hero Section with Live Dashboard Mockup & Floating Cards */}
        <HeroSection />

        {/* 3. Three Connected Portals: Owner, Staff, Dealer */}
        <RoleCardsSection />

        {/* 4. Highlights Bar: 4 Core Pillars */}
        <HighlightsBar />

        {/* 5. Key Features: 10 Operational Modules */}
        <FeaturesSection />

        {/* 6. Smart Connected Inventory Flow: 8 Steps */}
        <SmartInventoryFlow />

        {/* 7. Complete Batch Visibility: Paracetamol Multi-Batch UI */}
        <BatchVisibilitySection />

        {/* 8. Expiry Management: RED vs NORMAL Rules & Supplier Return */}
        <ExpiryManagementSection />

        {/* 9. Dealer Automation: When Stock Runs Low */}
        <DealerAutomationSection />

        {/* 10. AI-Powered Pharmacy Intelligence */}
        <AiIntelligenceSection />

        {/* 11. Pharmacy Analytics with Recharts & INR (₹) */}
        <AnalyticsSection />

        {/* 12. Security & Role-Based Access Matrix */}
        <SecurityAccessSection />

        {/* 13. Dedicated About Section */}
        <AboutSection />

        {/* 14. Final Call to Action */}
        <CtaSection />
      </main>

      {/* 15. Footer */}
      <LandingFooter />
    </div>
  );
}
