import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Sparkles, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl pt-4 sm:pt-8 space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-surface border border-line text-xs font-semibold text-ink shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-green" />
          <span>Academic Year 2026–27 Cycle Now Active</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight font-serif leading-[1.15]">
          From Eligibility <br className="hidden sm:inline" />
          <span className="text-green">to Action.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
          ScholarPath is a deterministic, citation-backed scholarship eligibility engine. 
          Discover what you qualify for, understand the exact rule clauses, and plan every document before the deadline.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link to="/quick-check">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Quick Eligibility Check
            </Button>
          </Link>
          <Link to="/wizard">
            <Button size="lg" variant="gold" leftIcon={<Sparkles className="w-4 h-4" />}>
              Eligibility DNA Wizard
            </Button>
          </Link>
          <Link to="/explore">
            <Button size="lg" variant="outline">
              Browse Schemes
            </Button>
          </Link>
        </div>
      </div>

      {/* Trust Principle Section */}
      <Card variant="muted" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Step 1</div>
            <h2 className="text-base font-bold text-ink">Rules Decide</h2>
            <p className="text-xs text-muted leading-relaxed">
              Deterministic rule engine verifies published government and institutional criteria. Zero guessing.
            </p>
          </div>
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Step 2</div>
            <h2 className="text-base font-bold text-ink">AI Explains</h2>
            <p className="text-xs text-muted leading-relaxed">
              Explains clauses, missing criteria, and document steps in plain language. AI never determines eligibility.
            </p>
          </div>
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Step 3</div>
            <h2 className="text-base font-bold text-ink">Authority Approves</h2>
            <p className="text-xs text-muted leading-relaxed">
              Final sanction, verification, and disbursement are always made by the designated authority.
            </p>
          </div>
        </div>
      </Card>

      {/* Phase 1 Verification Placeholder */}
      <div className="space-y-4">
        <PageHeader
          title="Core Capabilities"
          subtitle="Explore the key pillars of ScholarPath"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status="ELIGIBLE" size="sm" />
                <span className="text-[11px] text-muted">Tier A</span>
              </div>
              <CardTitle>Eligibility Receipt</CardTitle>
              <CardDescription>
                Clause-by-clause proof showing student criteria versus expected limits with official citations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status="NEARLY_ELIGIBLE" size="sm" />
                <span className="text-[11px] text-muted">Tier A</span>
              </div>
              <CardTitle>Unlock Engine</CardTitle>
              <CardDescription>
                Identifies high-impact actions (like renewing an income certificate) to unlock multiple schemes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status="READY" size="sm" />
                <span className="text-[11px] text-muted">Tier A</span>
              </div>
              <CardTitle>Pre-Flight Rejection Check</CardTitle>
              <CardDescription>
                Catches common reasons for application rejection before submission.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};
