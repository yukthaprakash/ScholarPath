import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';

export const PlanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical-Path Deadline Planner"
        subtitle="Reverse-scheduled timelines. Know the exact date each document must be initiated to beat official portal closures."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-green">In Progress</span>
              <span className="text-xs text-muted font-semibold">Target: 31 Oct 2026</span>
            </div>
            <CardTitle className="text-lg">NSP Central Sector Scheme (AY 2026–27)</CardTitle>
            <CardDescription>
              Requires Revenue Authority Income Certificate (estimated 14-day turnaround).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-l-2 border-line pl-4 space-y-4 text-xs">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-green absolute -left-[21px] top-1" />
                <span className="font-bold text-ink">Apply for Income Certificate via Seva Sindhu / Tahsildar</span>
                <p className="text-muted mt-0.5">Start by 10 October 2026 (14-day govt processing)</p>
              </div>
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-line-dark absolute -left-[21px] top-1" />
                <span className="font-bold text-ink">Submit Application on NSP Portal</span>
                <p className="text-muted mt-0.5">Final submission deadline: 31 October 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
