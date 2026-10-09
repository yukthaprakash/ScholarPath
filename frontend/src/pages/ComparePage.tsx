import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const ComparePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Side-by-Side Scheme Comparison"
        subtitle="Compare benefit amounts, renewal rules, and benefit conflict restrictions across up to 3 schemes."
      />

      <EmptyState
        icon={<Layers className="w-6 h-6" />}
        title="Select schemes to compare"
        description="Browse through your eligible schemes or search directory to pin schemes for clause-level comparison."
        action={
          <Link to="/explore">
            <Button size="md" variant="primary">
              Explore Scheme Directory
            </Button>
          </Link>
        }
      />
    </div>
  );
};
