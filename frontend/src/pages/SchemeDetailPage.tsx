import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { MANDATORY_ELIGIBILITY_DISCLAIMER } from '../types/eligibility';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { ExternalLink, ArrowLeft, ShieldCheck, Calendar, AlertCircle } from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { matches } = useProfile();

  const scheme = slug
    ? schemeService.getSchemeByIdOrSlug(slug)
    : schemeService.getAllSchemes()[0];

  if (!scheme) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-ink">Scheme Not Found</h2>
        <p className="text-xs text-muted">The requested scheme could not be located in the AY 2026–27 verified catalogue.</p>
        <Link to="/explore">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Scheme Directory
          </Button>
        </Link>
      </div>
    );
  }

  const match = matches.find((m) => m.schemeId === scheme.id);
  const status = match?.status || 'NEEDS_VERIFICATION';
  const clauses = match?.ruleTrace.clauses || [];
  const preflights = match?.preflightChecks || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={scheme.name}
        subtitle={`${scheme.provider} · ${scheme.authority}`}
        backHref="/explore"
        backLabel="Scheme Directory"
        action={
          <div className="flex items-center gap-2">
            <Link to="/compare">
              <Button size="sm" variant="outline">
                Compare
              </Button>
            </Link>
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Apply on Official Portal
              </Button>
            </a>
          </div>
        }
      />

      {/* Regulatory Notice Banner */}
      <div className="p-3 bg-paper-surface border border-line rounded-lg text-xs text-muted flex items-center gap-2 shadow-subtle">
        <ShieldCheck className="w-4 h-4 text-green shrink-0" aria-hidden="true" />
        <span>{MANDATORY_ELIGIBILITY_DISCLAIMER}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Eligibility Receipt */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <StatusBadge status={status} />
                <TrustBadge tier={scheme.sourceTier} sourceName={scheme.officialSource} />
              </div>
              <CardTitle className="mt-3">Eligibility Receipt</CardTitle>
              <CardDescription>
                Deterministic rule trace. Each published clause is evaluated against your criteria without probabilistic AI decision-making.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {match?.distanceGap && (
                <div className="mb-4 p-3 bg-gold-surface border border-gold/40 rounded text-xs text-ink flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Distance Gap: </span>
                    {match.distanceGap}
                    {match.suggestedAction && <p className="text-muted mt-0.5">{match.suggestedAction}</p>}
                  </div>
                </div>
              )}

              <div className="border border-line rounded-md overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-paper-muted p-2.5 font-bold text-ink border-b border-line">
                  <span className="col-span-4">Rule Clause</span>
                  <span className="col-span-3">Your Profile</span>
                  <span className="col-span-3">Published Rule</span>
                  <span className="col-span-2 text-right">Result</span>
                </div>
                <div className="divide-y divide-line">
                  {clauses.map((clause, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-2.5 items-center">
                      <div className="col-span-4 pr-1">
                        <span className="font-semibold text-ink block">{clause.clauseName}</span>
                        <span className="text-[10px] text-muted block truncate">{clause.citationSource}</span>
                      </div>
                      <span className="col-span-3 text-muted pr-1 truncate">{clause.studentValue}</span>
                      <span className="col-span-3 text-muted pr-1 truncate">{clause.expectedValue}</span>
                      <div className="col-span-2 flex justify-end">
                        <StatusBadge
                          status={clause.result === 'PASS' ? 'READY' : clause.result === 'NEEDS_VERIFICATION' ? 'VERIFY' : 'MISSING'}
                          size="sm"
                          customLabel={clause.result === 'PASS' ? 'Pass' : clause.result === 'NEEDS_VERIFICATION' ? 'Audit' : 'Fail'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Pre-flight & Deadlines */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pre-Flight Rejection Check</CardTitle>
              <CardDescription>Verified against documented rejection causes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs">
                {preflights.map((pf) => (
                  <li key={pf.id} className="flex items-start gap-2">
                    <StatusBadge status={pf.status === 'READY' ? 'READY' : 'VERIFY'} size="sm" />
                    <div>
                      <span className="text-ink font-semibold block">{pf.checkName}</span>
                      <span className="text-muted text-[11px] leading-tight block">{pf.rationale}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card variant="muted">
            <CardHeader>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-ink" />
                <CardTitle className="text-base">Application Critical Path</CardTitle>
              </div>
              <CardDescription>Academic Year {scheme.academicYear} Cycle</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-muted">Application Deadline:</span>
                <span className="font-bold text-ink">{scheme.deadlineDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-muted">Start Documents By:</span>
                <span className="font-bold text-green">{scheme.startDocumentsByDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Benefit Amount:</span>
                <span className="font-bold text-ink">{scheme.benefitAmountText}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
