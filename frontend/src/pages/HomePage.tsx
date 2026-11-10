import React, { useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { MANDATORY_ELIGIBILITY_DISCLAIMER } from '../types/eligibility';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { TrustBadge } from '../components/common/TrustBadge';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Server, 
  WifiOff, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { profile, completionStats, matches, unlocks, isDemoMode, apiError, isSyncing, recalculateEligibility } = useProfile();

  // Ensure scheme catalog is fetched and cached from backend on mount
  useEffect(() => {
    schemeService.fetchSchemes({ limit: 50 }).catch(() => {
      // Non-fatal, schemes are already pre-seeded in local cache
    });
  }, []);

  const eligibleMatches = matches.filter((m) => m.status === 'ELIGIBLE');
  const nearlyMatches = matches.filter((m) => m.status === 'NEARLY_ELIGIBLE');
  const verifyMatches = matches.filter((m) => m.status === 'NEEDS_VERIFICATION');

  const displayName = profile.fullName ? profile.fullName.split(' ')[0] : 'Student';
  const displayDegree = profile.degreeName ? `${profile.degreeName} (${profile.courseName || 'Enrolled'})` : 'Student Degree';
  const displayState = profile.domicileState || 'Domicile State';

  return (
    <div className="space-y-8">
      {/* Backend / Demo Mode Status Bar */}
      <div className="flex items-center justify-between text-xs px-3 py-2 bg-paper-surface border border-line rounded-md">
        <div className="flex items-center gap-2">
          {isDemoMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-gold-hover" />
              <span className="text-muted font-medium">Demo / Local Evaluation Mode</span>
            </>
          ) : (
            <>
              <Server className="w-3.5 h-3.5 text-green" />
              <span className="text-muted font-medium">Connected to Backend API & Rule Engine</span>
            </>
          )}
          {apiError && <span className="text-gold-hover text-[11px]">({apiError})</span>}
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && <span className="text-muted text-[11px] animate-pulse">Syncing...</span>}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => recalculateEligibility()}
            disabled={isSyncing}
            leftIcon={<RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            Re-evaluate
          </Button>
        </div>
      </div>

      <PageHeader
        title={`Welcome back, ${displayName}`}
        subtitle={`Current Profile: ${displayDegree}, ${displayState}, Family Income: ₹${profile.annualFamilyIncome.toLocaleString('en-IN')}/yr.`}
        action={
          <div className="flex items-center gap-2">
            <Link to="/wizard">
              <Button size="sm" variant="gold" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                Edit Eligibility DNA
              </Button>
            </Link>
          </div>
        }
      />

      {/* Regulatory Notice Banner */}
      <div className="p-3 bg-paper-surface border border-line rounded-lg text-xs text-muted flex items-center gap-2 shadow-subtle">
        <ShieldCheck className="w-4 h-4 text-green shrink-0" aria-hidden="true" />
        <span>{MANDATORY_ELIGIBILITY_DISCLAIMER}</span>
      </div>

      {/* Snapshot Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm" className="bg-paper-surface">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Profile Completeness</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-ink">{completionStats.percentage}%</span>
            <span className="text-[10px] text-muted">DNA Status: {completionStats.isComplete ? 'Ready' : 'Incomplete'}</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-green-surface border-green/30">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-green text-xs font-semibold">
              <span>Eligible Now</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-green">{eligibleMatches.length} Schemes</span>
            <span className="text-[10px] text-green/80 font-medium">All Criteria Satisfied</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-gold-surface border-gold/40">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-ink text-xs font-semibold">
              <span>Nearly Eligible</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-ink">{nearlyMatches.length} Schemes</span>
            <span className="text-[10px] text-muted font-medium">Small Action Unlocks</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-paper-muted">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Needs Verification</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold text-ink">{verifyMatches.length} Schemes</span>
            <span className="text-[10px] text-muted">Document Audit Required</span>
          </div>
        </Card>
      </div>

      {/* Actionable Unlocks Section */}
      {unlocks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-hover" />
                Actionable Unlock Opportunities
              </h2>
              <p className="text-xs text-muted">
                Simulated changes that can bridge the distance gap to make you eligible for additional funding.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlocks.map((unlock) => (
              <Card key={unlock.id} variant="accent-gold">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">Simulated Path</span>
                    <span className="text-xs font-extrabold text-ink bg-gold/30 px-2 py-0.5 rounded">
                      +{unlock.potentialTotalBenefitText}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-ink">{unlock.simulatedActionTitle}</h3>
                  <p className="text-xs text-muted leading-relaxed">{unlock.description}</p>
                  <div className="pt-2 border-t border-gold/30 flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">
                      Unlocks {unlock.newlyEligibleSchemeIds.length} Scheme{unlock.newlyEligibleSchemeIds.length > 1 ? 's' : ''}
                    </span>
                    <Link to="/wizard" className="text-ink font-bold hover:underline flex items-center gap-1">
                      Update Profile <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Verified Scheme Matches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink">Evaluated Scheme Matches</h2>
            <p className="text-xs text-muted">
              Live deterministic verification of published government guidelines against your student profile.
            </p>
          </div>
          <Link to="/explore">
            <Button size="sm" variant="outline">
              Explore All Schemes
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {matches.length === 0 ? (
            <Card className="p-8 text-center text-muted text-xs">
              No scheme evaluation results yet. Edit your Eligibility DNA to discover matched scholarships.
            </Card>
          ) : (
            matches.map((match) => {
              const scheme = schemeService.getSchemeByIdOrSlug(match.schemeId);
              if (!scheme) {
                // If scheme not found in catalog, render basic card from ruleTrace
                return (
                  <Card key={match.schemeId}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={match.status} size="sm" />
                        </div>
                        <h3 className="text-base font-bold text-ink">{match.ruleTrace.schemeName}</h3>
                        <p className="text-xs text-muted">{match.ruleTrace.overallReason}</p>
                      </div>
                      <Link to={`/schemes/${match.schemeId}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={match.schemeId}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={match.status} size="sm" />
                        <TrustBadge tier={scheme.sourceTier} sourceName={scheme.officialSource} />
                        <span className="text-xs font-semibold text-muted">Deadline: {scheme.deadlineDate}</span>
                      </div>

                      <h3 className="text-base font-bold text-ink">{scheme.name}</h3>
                      <p className="text-xs text-muted">
                        {scheme.provider} · <strong className="text-ink font-semibold">{scheme.benefitAmountText}</strong>
                      </p>

                      {match.distanceGap && (
                        <p className="text-xs text-gold-hover font-semibold">
                          Gap Notice: {match.distanceGap}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/schemes/${scheme.slug}`}>
                        <Button size="sm" variant={match.status === 'ELIGIBLE' ? 'primary' : 'outline'}>
                          {match.status === 'ELIGIBLE' ? 'View Eligibility Receipt' : 'Inspect Gap Trace'}
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
    </div>
  );
};
