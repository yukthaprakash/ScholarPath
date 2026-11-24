import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineBanner, DemoModeBanner } from './OfflineBanner';
import { Disclaimer } from './Disclaimer';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-gold/20">
      {/* Skip to Main Content for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-ink text-paper px-4 py-2 rounded-md font-semibold text-xs shadow-lg"
      >
        Skip to main content
      </a>

      {/* Global Status Banners */}
      <OfflineBanner />
      <DemoModeBanner />

      {/* Primary Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12"
      >
        <Outlet />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-line bg-paper-surface/60 py-8 text-xs text-muted pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <Disclaimer />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-line/60">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-ink text-sm font-serif">ScholarPath</span>
              <p className="max-w-md text-muted leading-relaxed">
                Rules decide · AI explains · Authority approves. 
                A deterministic, citation-backed scholarship eligibility engine for Indian students.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <Link to="/explore" className="hover:text-ink transition-colors">
                Browse Schemes
              </Link>
              <Link to="/quick-check" className="hover:text-ink transition-colors">
                Quick Check
              </Link>
              <Link to="/wizard" className="hover:text-ink transition-colors">
                Eligibility DNA
              </Link>
              <a
                href="https://scholarships.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                <span>National Scholarship Portal (NSP)</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="text-[11px] text-muted/80 flex flex-col sm:flex-row justify-between gap-2">
            <span>Academic Year 2026–27 Cycle. Built for student community empowerment.</span>
            <span>Preliminary informational tool · Not a government agency.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
