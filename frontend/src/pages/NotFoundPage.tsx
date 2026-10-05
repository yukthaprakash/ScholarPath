import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Not Found"
        subtitle="The requested section does not exist or has been relocated."
      />

      <EmptyState
        icon={<FileQuestion className="w-6 h-6" />}
        title="404 — Section Not Found"
        description="Return to the student dashboard or browse the verified scholarship directory."
        action={
          <Link to="/home">
            <Button size="md" variant="primary">
              Return to Dashboard
            </Button>
          </Link>
        }
      />
    </div>
  );
};
