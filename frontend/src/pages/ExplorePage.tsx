import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { Scheme, SchemeType, ScopeType } from '../types/scheme';
import { EligibilityState, MANDATORY_ELIGIBILITY_DISCLAIMER } from '../types/eligibility';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const { matches } = useProfile();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-Dimensional Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<SchemeType | 'ALL'>('ALL');
  const [selectedScope, setSelectedScope] = useState<ScopeType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<EligibilityState | 'ALL'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadSchemes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const typeParam = selectedType === 'ALL' ? undefined : selectedType;
      const scopeParam = selectedScope === 'ALL' ? undefined : selectedScope;

      const result = await schemeService.fetchSchemes({
        query: searchQuery,
        type: typeParam,
        scope: scopeParam,
        page,
        limit: 10,
      });

      setSchemes(result.schemes);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (err: unknown) {
      // If backend fails, fallback to in-memory filter
      try {
        const fallback = schemeService.filterSchemes({
          query: searchQuery,
          type: selectedType === 'ALL' ? undefined : selectedType,
          scope: selectedScope === 'ALL' ? undefined : selectedScope,
        });
        setSchemes(fallback);
        setTotalPages(1);
        setTotalCount(fallback.length);
        setErrorMessage(null);
      } catch {
        setErrorMessage('Unable to load schemes catalog. Please check your backend connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedScope, page]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  // Client-side filtering by eligibility state across fetched schemes
  const displayedSchemes = useMemo(() => {
    if (statusFilter === 'ALL') return schemes;
    return schemes.filter((scheme) => {
      const match = matches.find((m) => m.schemeId === scheme.id || m.schemeId === scheme.slug);
      const matchStatus: EligibilityState = match?.status || 'NEEDS_VERIFICATION';
      return matchStatus === statusFilter;
    });
  }, [schemes, matches, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedScope('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setStatusFilter(e.target.value as EligibilityState | 'ALL');
                setPage(1);
              }}
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
              onChange={(e) => {
                setSelectedType(e.target.value as SchemeType | 'ALL');
                setPage(1);
              }}
            />
          </div>

          <div>
            <Select
              options={[
                { value: 'ALL', label: 'All Jurisdictions' },
                { value: 'CENTRAL', label: 'Central Govt (All-India)' },
                { value: 'STATE', label: 'State Schemes (SSP / Domicile)' },
              ]}
              value={selectedScope}
              onChange={(e) => {
                setSelectedScope(e.target.value as ScopeType | 'ALL');
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <Card className="border-gold/40 bg-gold-surface">
          <div className="flex items-center justify-between gap-3 text-xs text-ink">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold-hover shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button size="sm" variant="outline" onClick={loadSchemes} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-paper-surface border border-line rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-ink" />
          <p className="text-xs text-muted font-medium">Loading verified schemes from government registry...</p>
        </div>
      ) : displayedSchemes.length === 0 ? (
        /* Empty State */
        <Card className="text-center py-8">
          <p className="text-sm font-bold text-ink">No schemes match your selected filters</p>
          <p className="text-xs text-muted mt-1 mb-3">
            Try adjusting your search query, scheme type, jurisdiction, or eligibility state filters.
          </p>
          <Button size="sm" variant="outline" onClick={handleResetFilters}>
            Reset All Filters
          </Button>
        </Card>
      ) : (
        /* Scheme List */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>Showing {displayedSchemes.length} of {totalCount || schemes.length} verified schemes</span>
            {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
          </div>

          {displayedSchemes.map((scheme) => {
            const match = matches.find((m) => m.schemeId === scheme.id || m.schemeId === scheme.slug);
            const status: EligibilityState = match?.status || 'NEEDS_VERIFICATION';

            return (
              <Card key={scheme.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
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
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="text-xs text-muted font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
