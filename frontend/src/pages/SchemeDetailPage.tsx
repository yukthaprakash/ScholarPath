import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { ExternalLink } from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {

  return (
    <div className="space-y-8">
      <PageHeader
        title="Central Sector Scheme for College and University Students"
        subtitle="Department of Higher Education, Ministry of Education, Govt. of India"
        backHref="/home"
        backLabel="Matches"
        action={
          <div className="flex items-center gap-2">
            <Link to="/compare">
              <Button size="sm" variant="outline">
                Compare
              </Button>
            </Link>
            <a
              href="https://scholarships.gov.in"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Apply on Official Portal
              </Button>
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Eligibility Receipt Foundation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <StatusBadge status="ELIGIBLE" />
                <TrustBadge tier="TIER_1_OFFICIAL" sourceName="NSP Guidelines 2026-27" />
              </div>
              <CardTitle className="mt-3">Eligibility Receipt</CardTitle>
              <CardDescription>
                Deterministic rule trace. Each published clause is evaluated against your criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-line rounded-md overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-paper-muted p-2.5 font-bold text-ink border-b border-line">
                  <span>Clause</span>
                  <span>Your Data</span>
                  <span>Required</span>
                  <span className="text-right">Result</span>
                </div>
                <div className="divide-y divide-line">
                  <div className="grid grid-cols-4 p-2.5 items-center">
                    <span className="font-medium text-ink">Family Income</span>
                    <span className="text-muted">₹2,00,000/yr</span>
                    <span className="text-muted">≤ ₹4,50,000/yr</span>
                    <div className="flex justify-end">
                      <StatusBadge status="ELIGIBLE" size="sm" customLabel="Pass" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 items-center">
                    <span className="font-medium text-ink">Academic Level</span>
                    <span className="text-muted">Undergraduate</span>
                    <span className="text-muted">Undergraduate / PG</span>
                    <div className="flex justify-end">
                      <StatusBadge status="ELIGIBLE" size="sm" customLabel="Pass" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 items-center">
                    <span className="font-medium text-ink">Board Percentile</span>
                    <span className="text-muted">88th Percentile</span>
                    <span className="text-muted">&gt; 80th Percentile</span>
                    <div className="flex justify-end">
                      <StatusBadge status="ELIGIBLE" size="sm" customLabel="Pass" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Pre-flight & Deadlines */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pre-Flight Rejection Check</CardTitle>
              <CardDescription>Verified against documented rejection causes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <StatusBadge status="READY" size="sm" />
                  <span className="text-ink">Aadhaar seeded with active bank account</span>
                </li>
                <li className="flex items-start gap-2">
                  <StatusBadge status="READY" size="sm" />
                  <span className="text-ink">Institution AISHE code registered on NSP</span>
                </li>
                <li className="flex items-start gap-2">
                  <StatusBadge status="VERIFY" size="sm" />
                  <span className="text-ink">Income certificate issued after 01 April 2026</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card variant="muted">
            <CardHeader>
              <CardTitle className="text-base">Application Critical Path</CardTitle>
              <CardDescription>Academic Year 2026–27 Cycle</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Application Deadline:</span>
                <span className="font-bold text-ink">31 October 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Start Documents By:</span>
                <span className="font-bold text-green">10 October 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
