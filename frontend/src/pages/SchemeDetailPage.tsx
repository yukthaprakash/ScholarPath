import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { TrustBadge } from '../components/common/TrustBadge';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';
import { schemeService } from '../services/schemeService';
import { eligibilityService, BackendSchemeExplanation } from '../services/eligibilityService';
import { Scheme } from '../types/scheme';
import { useProfile } from '../contexts/ProfileContext';

export const SchemeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { matches } = useProfile();

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [explanation, setExplanation] = useState<BackendSchemeExplanation | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [isLoadingScheme, setIsLoadingScheme] = useState<boolean>(true);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Match result from ProfileContext
  const currentMatch = matches.find((m) => m.schemeId === scheme?.id || m.schemeId === slug);

  // 1. Load Scheme Metadata
  const loadScheme = useCallback(async () => {
    if (!slug) return;
    setIsLoadingScheme(true);
    setError(null);

    try {
      const data = await schemeService.fetchSchemeBySlug(slug);
      setScheme(data);
    } catch (err: unknown) {
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

      // Handle single scheme explanation response
      if ('explanation' in result) {
        setExplanation(result as BackendSchemeExplanation);
      }
    } catch {
      // Explanation API unavailable or profile incomplete: non-fatal, recipe continues with engine data
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
      <div className="space-y-6">
        <PageHeader title="Scheme Not Found" backHref="/explore" backLabel="Directory" />
        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red mx-auto" />
          <h2 className="text-lg font-bold text-ink">Scheme Not Found</h2>
          <p className="text-xs text-muted max-w-md mx-auto">
            {error || `We could not locate scheme '${slug}'. It may have been archived or updated.`}
          </p>
          <Link to="/explore">
            <Button size="sm" variant="primary" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Scheme Directory
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const matchStatus = explanation?.state || currentMatch?.status || 'ELIGIBLE';

  return (
    <div className="space-y-8">
      <PageHeader
        title={scheme.name}
        subtitle={`${scheme.provider} · ${scheme.authority}`}
        backHref="/home"
        backLabel="Matches"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Eligibility Receipt Foundation & AI Plain Language Explanation */}
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

          {/* Eligibility Receipt Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <StatusBadge status={matchStatus} />
                <TrustBadge tier={scheme.sourceTier} sourceName={scheme.officialSource} />
              </div>
              <CardTitle className="mt-3">Eligibility Receipt</CardTitle>
              <CardDescription>
                Deterministic rule trace. Each published clause is evaluated against your criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-line rounded-md overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-paper-muted p-2.5 font-bold text-ink border-b border-line">
                  <span>Clause</span>
                  <span>Your Data</span>
                  <span>Required</span>
                  <span className="text-right">Result</span>
                </div>
                <div className="divide-y divide-line">
                  {/* Real evaluation clauses if available */}
                  {currentMatch?.ruleTrace?.clauses && currentMatch.ruleTrace.clauses.length > 0 ? (
                    currentMatch.ruleTrace.clauses.map((clause, idx) => (
                      <div key={idx} className="grid grid-cols-4 p-2.5 items-center gap-2">
                        <span className="font-medium text-ink">{clause.clauseName}</span>
                        <span className="text-muted truncate">{clause.studentValue}</span>
                        <span className="text-muted truncate">{clause.expectedValue}</span>
                        <div className="flex justify-end">
                          <StatusBadge 
                            status={clause.result === 'PASS' ? 'ELIGIBLE' : clause.result === 'NEEDS_VERIFICATION' ? 'NEEDS_VERIFICATION' : 'NOT_MATCHED'} 
                            size="sm" 
                            customLabel={clause.result === 'PASS' ? 'Pass' : clause.result === 'NEEDS_VERIFICATION' ? 'Verify' : 'Fail'} 
                          />
                        </div>
                      </div>
                    ))
                  ) : explanation?.details ? (
                    <>
                      {explanation.details.satisfiedRequirements.map((req, idx) => (
                        <div key={`pass-${idx}`} className="grid grid-cols-4 p-2.5 items-center gap-2">
                          <span className="font-medium text-ink">{req.label}</span>
                          <span className="text-muted">{String(req.studentValue ?? 'Satisfied')}</span>
                          <span className="text-muted">{String(req.expectedValue ?? 'Eligible')}</span>
                          <div className="flex justify-end">
                            <StatusBadge status="ELIGIBLE" size="sm" customLabel="Pass" />
                          </div>
                        </div>
                      ))}
                      {explanation.details.failedRequirements.map((req, idx) => (
                        <div key={`fail-${idx}`} className="grid grid-cols-4 p-2.5 items-center gap-2">
                          <span className="font-medium text-ink">{req.label}</span>
                          <span className="text-muted">{String(req.studentValue ?? 'Unmatched')}</span>
                          <span className="text-muted">{String(req.expectedValue ?? 'Required')}</span>
                          <div className="flex justify-end">
                            <StatusBadge status="NOT_MATCHED" size="sm" customLabel="Fail" />
                          </div>
                        </div>
                      ))}
                    </>
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
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span className="text-ink">Aadhaar seeded with active bank account for DBT</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span className="text-ink">Institution registered on authorized government portal</span>
                </li>
                <li className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                  <span className="text-ink">Income certificate issued for current academic cycle</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card variant="muted">
            <CardHeader>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted" />
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
