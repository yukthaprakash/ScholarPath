import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Users, Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

export const HouseholdPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Household Mode"
        subtitle="Manage scholarships and welfare fee waivers for siblings and dependents under a single household income umbrella."
        action={
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Sibling / Dependent
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <Users className="w-3.5 h-3.5" />
              <span>Primary Student</span>
            </div>
            <CardTitle className="text-base mt-1">Vraj (You)</CardTitle>
            <CardDescription>B.E. Undergraduate · 2 Verified Matches</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted">
            Sharing household income quota: ₹2,00,000/yr.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
