import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { Search, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { schemeService } from '../services/schemeService';
import { Scheme, SchemeType, ScopeType } from '../types/scheme';
import { useProfile } from '../contexts/ProfileContext';

export const ExplorePage: React.FC = () => {
  const { matches } = useProfile();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadSchemes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const typeParam = selectedType === 'all' ? undefined : (selectedType.toUpperCase() as SchemeType);
      const scopeParam = selectedScope === 'all' ? undefined : (selectedScope.toUpperCase() as ScopeType);

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
          type: selectedType === 'all' ? undefined : (selectedType.toUpperCase() as SchemeType),
          scope: selectedScope === 'all' ? undefined : (selectedScope.toUpperCase() as ScopeType),
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

  // Lookup match status from ProfileContext if evaluated
  const getMatchStatus = (schemeId: string, schemeSlug: string) => {
    const match = matches.find((m) => m.schemeId === schemeId || m.schemeId === schemeSlug);
    return match?.status;
  };

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
              { value: 'all', label: 'All Scheme Types' },
              { value: 'scholarship', label: 'Scholarships' },
              { value: 'fellowship', label: 'Fellowships' },
              { value: 'fee_waiver', label: 'Fee Waivers' },
              { value: 'hostel_stipend', label: 'Hostel / Stipend' },
            ]}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Jurisdictions' },
              { value: 'central', label: 'Central Govt (All-India)' },
              { value: 'state', label: 'State Government' },
            ]}
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(e.target.value);
              setPage(1);
            }}
          />
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
      ) : schemes.length === 0 ? (
        /* Empty State */
        <div className="text-center p-12 bg-paper-surface border border-line rounded-lg space-y-3">
          <h3 className="text-base font-bold text-ink">No schemes match your search criteria</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Try adjusting your search keywords, scheme type, or jurisdiction filters to see more results.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedScope('all');
              setPage(1);
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        /* Scheme List */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>Showing {schemes.length} of {totalCount} verified schemes</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {schemes.map((scheme) => {
            const status = getMatchStatus(scheme.id, scheme.slug);

            return (
              <Card key={scheme.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {status && <StatusBadge status={status} size="sm" />}
                      <TrustBadge tier={scheme.sourceTier} sourceName={scheme.officialSource} />
                      <span className="text-xs text-muted font-medium">
                        {scheme.scope === 'STATE' && scheme.targetState ? `State: ${scheme.targetState}` : 'Central Govt (All-India)'}
                        {' · '}
                        {scheme.benefitAmountText}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-ink">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2">
                      {scheme.description}
                    </p>
                  </div>
                  <Link to={`/schemes/${scheme.slug}`} className="shrink-0">
                    <Button size="sm" variant={status === 'ELIGIBLE' ? 'primary' : 'secondary'}>
                      View Scheme
                    </Button>
                  </Link>
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
