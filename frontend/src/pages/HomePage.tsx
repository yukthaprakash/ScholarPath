import React from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { TrustBadge } from '../components/common/TrustBadge';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, HelpCircle, FileText } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { profile, completionStats, matches, unlocks } = useProfile();

  const eligibleMatches = matches.filter((m) => m.status === 'ELIGIBLE');
  const nearlyMatches = matches.filter((m) => m.status === 'NEARLY_ELIGIBLE');
  const verifyMatches = matches.filter((m) => m.status === 'NEEDS_VERIFICATION');

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${profile.fullName.split(' ')[0]}`}
        subtitle={`Current Profile: ${profile.degreeName} (${profile.courseName}), ${profile.domicileState}, Income: ₹${profile.annualFamilyIncome.toLocaleString('en-IN')}/yr.`}
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

      {/* Unlock Opportunities Section */}
      {unlocks.length > 0 && (
        <Card variant="accent-gold">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ink" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  Unlock Opportunity Identified
                </span>
              </div>
              <h2 className="text-base font-bold text-ink">
                {unlocks[0].simulatedActionTitle}
              </h2>
              <p className="text-xs text-ink/80 max-w-xl leading-relaxed">
                {unlocks[0].description} Unlocks up to <strong className="text-ink">{unlocks[0].potentialTotalBenefitText}</strong> in additional state fee waivers.
              </p>
            </div>
            <Link to={`/schemes/${unlocks[0].newlyEligibleSchemeIds[0] || 'karnataka-ssp-post-matric'}`}>
              <Button size="sm" variant="gold" className="shrink-0">
                Simulate Action
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Verified Scheme Matches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Your Personalized Scheme Matches</h2>
            <p className="text-xs text-muted">Evaluated strictly against published government guidelines for AY 2026–27.</p>
          </div>
          <Link to="/explore">
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore Directory
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {matches.map((match) => {
            const scheme = schemeService.getSchemeByIdOrSlug(match.schemeId);
            if (!scheme) return null;

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
          })}
        </div>
      </div>
    </div>
  );
};
