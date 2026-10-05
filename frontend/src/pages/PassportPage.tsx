import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Plus, ShieldCheck, FileCheck } from 'lucide-react';

export const PassportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate Passport"
        subtitle="Manage government certificate metadata once. Track validity years, RD numbers, and issuing authorities across all schemes."
        action={
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Certificate Record
          </Button>
        }
      />

      <div className="p-3 bg-paper-surface border border-line rounded-md text-xs text-muted flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-green shrink-0" aria-hidden="true" />
        <span>
          <strong>Privacy Standard:</strong> ScholarPath stores metadata only (RD number, issuing department, issue date). No raw identity documents are ever uploaded.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-green">Valid for AY 2026–27</span>
              <FileCheck className="w-4 h-4 text-green" aria-hidden="true" />
            </div>
            <CardTitle className="text-base mt-1">Income Certificate</CardTitle>
            <CardDescription>Revenue Department (Tahsildar)</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Certificate / RD No:</span>
              <span className="font-mono text-ink font-semibold">RD0038472918</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Certified Annual Income:</span>
              <span className="font-bold text-ink">₹2,00,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Validity Year:</span>
              <span className="text-ink">2026–2031 (5 Years)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
