import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const SavedPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Schemes"
        subtitle="Bookmark schemes you are actively preparing documents for or tracking."
      />

      <EmptyState
        icon={<Bookmark className="w-6 h-6" />}
        title="No saved schemes yet"
        description="Save schemes while browsing the directory or reviewing your eligibility receipt."
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
