import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { schemeService } from '../services/schemeService';
import { eligibilityService, BackendSchemeExplanation } from '../services/eligibilityService';
import { Scheme } from '../types/scheme';
import { MANDATORY_ELIGIBILITY_DISCLAIMER } from '../types/eligibility';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import {
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { matches } = useProfile();

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [explanation, setExplanation] = useState<BackendSchemeExplanation | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [isLoadingScheme, setIsLoadingScheme] = useState<boolean>(true);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load Scheme Metadata
  const loadScheme = useCallback(async () => {
    if (!slug) return;
    setIsLoadingScheme(true);
    setError(null);

    try {
      const data = await schemeService.fetchSchemeBySlug(slug);
      setScheme(data);
    } catch {
      // Try local fallback
      const local = schemeService.getSchemeByIdOrSlug(slug);
      if (local) {
        setScheme(local);
      } else {
        setError(`Scholarship scheme '${slug}' could not be found.`);
      }
    } finally {
      setIsLoadingScheme(false);
    }
  }, [slug]);

  // 2. Load AI Plain-Language Explanation
  const loadExplanation = useCallback(async (lang: 'en' | 'kn' | 'hi') => {
    if (!slug) return;
    setIsLoadingExplanation(true);

    try {
      const result = await eligibilityService.explainWithBackend({
        schemeSlug: slug,
        language: lang,
      });

      if ('explanation' in result) {
        setExplanation(result as BackendSchemeExplanation);
      }
    } catch {
      // Explanation API unavailable: non-fatal, deterministic receipt continues with engine data
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [slug]);

  useEffect(() => {
    loadScheme();
  }, [loadScheme]);

  useEffect(() => {
    if (scheme) {
      loadExplanation(selectedLanguage);
    }
  }, [scheme, selectedLanguage, loadExplanation]);

  if (isLoadingScheme) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
        <p className="text-sm text-muted font-medium">Retrieving verified scheme rules and criteria...</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 text-center">
        <AlertCircle className="w-8 h-8 text-red mx-auto" />
        <h2 className="text-xl font-bold text-ink">Scheme Not Found</h2>
        <p className="text-xs text-muted">
          {error || `The requested scheme '${slug}' could not be located in the AY 2026–27 verified catalogue.`}
        </p>
        <Link to="/explore">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Scheme Directory
          </Button>
        </Link>
      </div>
    );
  }

  const match = matches.find((m) => m.schemeId === scheme.id || m.schemeId === slug);
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
        {/* Main 2 Cols: AI Plain Language Explanation & Eligibility Receipt */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Plain-Language Explanation Card */}
          <Card variant="accent-gold">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ink" />
                  <CardTitle className="text-base">Authoritative AI Explanation</CardTitle>
                </div>
                <div className="w-36">
                  <Select
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                      { value: 'hi', label: 'हिंदी (Hindi)' },
                    ]}
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'kn' | 'hi')}
                  />
                </div>
              </div>
              <CardDescription>
                Authoritative plain-language breakdown grounded strictly in rule engine evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExplanation ? (
                <div className="flex items-center gap-2 text-xs text-muted py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing plain-language explanation in {selectedLanguage.toUpperCase()}...</span>
                </div>
              ) : explanation ? (
                <div className="space-y-4">
                  <p className="text-xs text-ink/90 leading-relaxed font-medium bg-paper-surface/60 p-3 rounded border border-line">
                    {explanation.explanation}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <ShieldCheck className="w-3.5 h-3.5 text-green" />
                    <span>
                      {explanation.isFallback
                        ? 'Grounded deterministic explanation (zero LLM hallucinations)'
                        : 'Gemini AI explanation verified for consistency against pure rule engine'}
                    </span>
                  </div>

                  {explanation.details.nextSteps && explanation.details.nextSteps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-ink">Actionable Next Steps:</span>
                      <ul className="space-y-1 text-xs text-muted list-disc list-inside">
                        {explanation.details.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Connect your student profile to view tailored plain-language explanations in English, Kannada, or Hindi.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deterministic Eligibility Receipt Card */}
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
                  {clauses.length > 0 ? (
                    clauses.map((clause, idx) => (
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
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted">
                      No evaluation record found. Update your profile to generate an eligibility receipt.
                    </div>
                  )}
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
            <CardContent className="text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <span className="text-muted">Financial Benefit:</span>
                <span className="font-bold text-ink">{scheme.benefitAmountText}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <span className="text-muted">Application Deadline:</span>
                <span className="font-bold text-ink">{scheme.deadlineDate}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <span className="text-muted">Start Documents By:</span>
                <span className="font-bold text-green">{scheme.startDocumentsByDate}</span>
              </div>
              <div className="pt-2">
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button size="sm" variant="primary" className="w-full" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Official Application Link
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
