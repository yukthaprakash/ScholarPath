import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheme Directory"
        subtitle="Explore all verified scholarships, fellowships, and welfare fee waivers for AY 2026–27."
      />

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-paper-surface border border-line rounded-lg shadow-subtle">
        <div className="sm:col-span-1">
          <Input
            placeholder="Search by scheme name or keyword..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Scheme Types' },
              { value: 'scholarship', label: 'Scholarships' },
              { value: 'fee_waiver', label: 'Fee Waivers' },
              { value: 'hostel_stipend', label: 'Hostel / Stipend' },
            ]}
            defaultValue="all"
          />
        </div>
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Jurisdictions' },
              { value: 'central', label: 'Central Govt (NSP)' },
              { value: 'karnataka', label: 'State: Karnataka (SSP)' },
            ]}
            defaultValue="all"
          />
        </div>
      </div>

      {/* Scheme List Shell */}
      <div className="space-y-3">
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="ELIGIBLE" size="sm" />
                <TrustBadge tier="TIER_1_OFFICIAL" sourceName="NSP Official" />
                <span className="text-xs text-muted font-medium">Undergraduate · All India</span>
              </div>
              <h3 className="text-base font-bold text-ink">
                Central Sector Scheme of Scholarship for College and University Students
              </h3>
              <p className="text-xs text-muted">
                Requires &gt; 80th percentile in Class 12 board exams and family income &lt; ₹4,50,000.
              </p>
            </div>
            <Link to="/schemes/central-sector-scheme">
              <Button size="sm" variant="secondary" className="shrink-0">
                View Scheme
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="NEARLY_ELIGIBLE" size="sm" />
                <TrustBadge tier="TIER_1_OFFICIAL" sourceName="SSP Karnataka" />
                <span className="text-xs text-muted font-medium">Post-Matric · Karnataka</span>
              </div>
              <h3 className="text-base font-bold text-ink">
                Post-Matric Scholarship for SC/ST Students (SSP)
              </h3>
              <p className="text-xs text-muted">
                Mandatory Karnataka domicile, valid RD-number caste & income certificate.
              </p>
            </div>
            <Link to="/schemes/karnataka-ssp-post-matric">
              <Button size="sm" variant="secondary" className="shrink-0">
                View Scheme
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
