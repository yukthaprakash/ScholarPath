import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ClipboardList } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Stage Tracker"
        subtitle="Track applications through Institute Verification → District Nodal → State Approval → Bank PFMS Disbursement."
      />

      <EmptyState
        icon={<ClipboardList className="w-6 h-6" />}
        title="No active tracked applications"
        description="Once you initiate an application on an official portal (NSP, SSP, etc.), log its application number here to receive stage alerts."
      />
    </div>
  );
};
