import React, { useState, useMemo } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { SchemeType, ScopeType } from '../types/scheme';
import { EligibilityState, MANDATORY_ELIGIBILITY_DISCLAIMER } from '../types/eligibility';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { Search, Filter, ShieldCheck, ArrowRight } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const { matches } = useProfile();
  const allSchemes = useMemo(() => schemeService.getAllSchemes(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SchemeType | 'ALL'>('ALL');
  const [selectedScope, setSelectedScope] = useState<ScopeType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<EligibilityState | 'ALL'>('ALL');

  // Filter schemes with consistent eligibility status from shared matches
  const filteredSchemes = useMemo(() => {
    return allSchemes.filter((scheme) => {
      // Find corresponding deterministic match result
      const match = matches.find((m) => m.schemeId === scheme.id);
      const matchStatus = match?.status || 'NEEDS_VERIFICATION';

      // 1. Keyword search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = scheme.name.toLowerCase().includes(q);
        const matchesDesc = scheme.description.toLowerCase().includes(q);
        const matchesProvider = scheme.provider.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesProvider) return false;
      }

      // 2. Scheme Type filter
      if (selectedType !== 'ALL' && scheme.type !== selectedType) {
        return false;
      }

      // 3. Jurisdiction / Scope filter
      if (selectedScope !== 'ALL' && scheme.scope !== selectedScope) {
        return false;
      }

      // 4. Eligibility State filter
      if (statusFilter !== 'ALL' && matchStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [allSchemes, matches, searchQuery, selectedType, selectedScope, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheme Directory"
        subtitle="Explore verified scholarships, fellowships, and tuition fee waivers for AY 2026–27 evaluated against your profile."
      />

      {/* Mandatory Regulatory Assessment Notice */}
      <div className="p-3 bg-paper-surface border border-line rounded-lg text-xs text-muted flex items-center gap-2 shadow-subtle">
        <ShieldCheck className="w-4 h-4 text-green shrink-0" aria-hidden="true" />
        <span>{MANDATORY_ELIGIBILITY_DISCLAIMER}</span>
      </div>

      {/* Search and Multi-Dimensional Filter Bar */}
      <div className="p-4 bg-paper-surface border border-line rounded-lg shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter & Search Schemes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Input
              placeholder="Search by name or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <Select
              options={[
                { value: 'ALL', label: 'All Eligibility States' },
                { value: 'ELIGIBLE', label: 'Eligible Only' },
                { value: 'NEARLY_ELIGIBLE', label: 'Nearly Eligible' },
                { value: 'NEEDS_VERIFICATION', label: 'Needs Verification' },
                { value: 'NOT_MATCHED', label: 'Not Matched' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EligibilityState | 'ALL')}
            />
          </div>

          <div>
            <Select
              options={[
                { value: 'ALL', label: 'All Scheme Types' },
                { value: 'SCHOLARSHIP', label: 'Scholarships' },
                { value: 'FEE_WAIVER', label: 'Fee Waivers' },
                { value: 'HOSTEL_STIPEND', label: 'Hostel / Stipend' },
                { value: 'FELLOWSHIP', label: 'Fellowships' },
              ]}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SchemeType | 'ALL')}
            />
          </div>

          <div>
            <Select
              options={[
                { value: 'ALL', label: 'All Jurisdictions' },
                { value: 'CENTRAL', label: 'Central Govt (NSP)' },
                { value: 'STATE', label: 'State Schemes (SSP / Domicile)' },
              ]}
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as ScopeType | 'ALL')}
            />
          </div>
        </div>
      </div>

      {/* Filtered Scheme Matches List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Showing {filteredSchemes.length} of {allSchemes.length} verified schemes</span>
          <span>Single Source of Truth Evaluation</span>
        </div>

        {filteredSchemes.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm font-bold text-ink">No schemes match your selected filters</p>
            <p className="text-xs text-muted mt-1 mb-3">Try adjusting your search query or reset the filters to see all available schemes.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setSelectedScope('ALL');
                setStatusFilter('ALL');
              }}
            >
              Reset All Filters
            </Button>
          </Card>
        ) : (
          filteredSchemes.map((scheme) => {
            const match = matches.find((m) => m.schemeId === scheme.id);
            const status: EligibilityState = match?.status || 'NEEDS_VERIFICATION';

            return (
              <Card key={scheme.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={status} size="sm" />
                      <TrustBadge tier={scheme.sourceTier} sourceName={scheme.officialSource} />
                      <span className="text-xs font-semibold text-muted">
                        Deadline: {scheme.deadlineDate}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-ink">{scheme.name}</h3>
                    <p className="text-xs text-muted">
                      {scheme.provider} · <strong className="text-ink font-semibold">{scheme.benefitAmountText}</strong>
                    </p>

                    <p className="text-xs text-muted/90 line-clamp-2">
                      {scheme.description}
                    </p>

                    {match?.distanceGap && (
                      <p className="text-xs text-gold-hover font-semibold">
                        Gap Notice: {match.distanceGap}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/schemes/${scheme.slug}`}>
                      <Button size="sm" variant={status === 'ELIGIBLE' ? 'primary' : 'outline'} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        View Scheme Receipt
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
