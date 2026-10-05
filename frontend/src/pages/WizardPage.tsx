import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { StudentProfile, EducationLevel, SocialCategory } from '../types/profile';
import { PassportDocument, DocumentType, VerificationStatus } from '../types/passport';
import { VERIFIED_COLLEGES, VERIFIED_DEGREES } from '../fixtures/verifiedColleges';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { StatusBadge } from '../components/common/StatusBadge';
import { ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, AlertTriangle, Info } from 'lucide-react';

const INDIAN_STATES = [
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Delhi', label: 'Delhi NCR' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Other', label: 'Other State / Union Territory' },
];

const STANDARD_DOC_TYPES: { type: DocumentType; name: string; issuer: string }[] = [
  { type: 'INCOME_CERTIFICATE', name: 'Income Certificate', issuer: 'Revenue Dept / Tahsildar' },
  { type: 'CASTE_CERTIFICATE', name: 'Caste Certificate', issuer: 'Revenue Dept / Welfare Dept' },
  { type: 'DOMICILE_CERTIFICATE', name: 'State Domicile Certificate', issuer: 'Tahsildar / Municipal Office' },
  { type: 'MARKS_CARD_12TH', name: 'Class 12 / PUC Marksheet', issuer: 'State Board / CBSE / ICSE' },
  { type: 'MARKS_CARD_PREVIOUS_SEM', name: 'Previous Semester Marksheet', issuer: 'University Registrar' },
  { type: 'BONAFIDE_CERTIFICATE', name: 'College Bonafide Certificate', issuer: 'College Principal' },
  { type: 'BANK_PASSBOOK_SEEDED', name: 'Bank Passbook (Aadhaar Seeded)', issuer: 'Nationalized Bank' },
];

export const WizardPage: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<StudentProfile>({ ...profile });

  // Options mapping
  const collegeOptions = VERIFIED_COLLEGES.map((c) => ({
    value: c.id,
    label: c.name,
    subLabel: `${c.university} · ${c.district}, ${c.state}`,
  }));

  const degreeOptions = VERIFIED_DEGREES.map((d) => ({
    value: d.id,
    label: `${d.degreeName} - ${d.courseName}`,
    subLabel: `Level: ${d.level}`,
  }));

  const handleInputChange = <K extends keyof StudentProfile>(field: K, value: StudentProfile[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDocumentStatusChange = (docType: DocumentType, status: VerificationStatus) => {
    const existingDocs = [...(formData.documents || [])];
    const index = existingDocs.findIndex((d) => d.documentType === docType);

    const defaultInfo = STANDARD_DOC_TYPES.find((d) => d.type === docType);
    const name = defaultInfo ? defaultInfo.name : docType.replace(/_/g, ' ');
    const issuer = defaultInfo ? defaultInfo.issuer : 'Authorized Issuing Authority';

    if (index >= 0) {
      existingDocs[index] = {
        ...existingDocs[index],
        verificationStatus: status,
      };
    } else {
      const newDoc: PassportDocument = {
        id: `doc-${docType.toLowerCase()}-${Date.now()}`,
        documentType: docType,
        documentName: name,
        issuer: issuer,
        issueDate: '2026-04-01',
        validityYear: '2026-27',
        referenceNumber: status === 'VERIFIED' ? `RD${Math.floor(1000000000 + Math.random() * 9000000000)}` : '',
        verificationStatus: status,
        academicYear: formData.academicYear || '2026-27',
      };
      existingDocs.push(newDoc);
    }

    setFormData((prev) => ({
      ...prev,
      documents: existingDocs,
    }));
  };

  const getDocStatus = (docType: DocumentType): VerificationStatus => {
    const doc = (formData.documents || []).find((d) => d.documentType === docType);
    return doc ? doc.verificationStatus : 'MISSING';
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishWizard = () => {
    updateProfile(formData);
    navigate('/home');
  };

  const stepTitles = [
    'About You',
    'Social Category',
    'Academic Details',
    'Financial Status',
    'Residency & Domicile',
    'Special Eligibility',
    'Document Readiness',
  ];

  const stepSubtitles = [
    'Basic identity & contact details to establish demographic profile.',
    'Social category & quota classifications for welfare schemes.',
    'Educational institution, degree, and academic performance.',
    'Family income thresholds published by government departments.',
    'Permanent state domicile & current residence details.',
    'Tailored condition questions based on your background.',
    'Metadata audit of supporting documents (no raw uploads required).',
  ];

  const progressPercentage = Math.round((currentStep / 7) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2 sm:py-6 px-1">
      <PageHeader
        title="Eligibility DNA Onboarding"
        subtitle={`Step ${currentStep} of 7: ${stepTitles[currentStep - 1]}. ${stepSubtitles[currentStep - 1]}`}
        backHref="/home"
        backLabel="Dashboard"
      />

      {/* Visual Progress Bar & Step Tracker */}
      <div className="space-y-2 bg-paper-surface p-4 border border-line rounded-lg shadow-subtle">
        <div className="flex items-center justify-between text-xs font-bold text-ink">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-ink text-paper text-[11px] flex items-center justify-center font-bold">
              {currentStep}
            </span>
            Step {currentStep} of 7 — {stepTitles[currentStep - 1]}
          </span>
          <span className="text-muted">{progressPercentage}% Complete</span>
        </div>
        <div className="w-full bg-line h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-ink h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <Card>
        {/* STEP 1 — ABOUT YOU */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Personal Identification</CardTitle>
              <CardDescription>
                Official demographic information used across NSP, SSP, and state scholarship portals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name (as in Aadhaar / Official Marksheet)"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                whyWeAsk="Scheme portals require exact name matching across Aadhaar, bank accounts, and certificates to avoid rejection."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => {
                    handleInputChange('dob', e.target.value);
                    handleInputChange('dateOfBirth', e.target.value);
                  }}
                  required
                  whyWeAsk="Age limits apply for specific fellowships, research grants, and youth welfare schemes."
                />

                <Select
                  label="Gender"
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other / Transgender' },
                    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                  ]}
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as StudentProfile['gender'])}
                  required
                  whyWeAsk="Certain schemes (such as AICTE Pragati) are reserved exclusively for female applicants."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="student@example.edu.in"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  whyWeAsk="Used for application deadline reminders and status change alerts."
                />

                <Input
                  label="Phone Number (Aadhaar Seeded)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  whyWeAsk="Official government portals dispatch OTP verification to Aadhaar-linked mobile numbers."
                />
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 2 — SOCIAL CATEGORY */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Social & Category Classification</CardTitle>
              <CardDescription>
                State and Central welfare departments administer dedicated scholarship allocations per category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Social Category"
                options={[
                  { value: 'GENERAL', label: 'General / Unreserved' },
                  { value: 'OBC', label: 'OBC (Other Backward Classes)' },
                  { value: 'SC', label: 'SC (Scheduled Caste)' },
                  { value: 'ST', label: 'ST (Scheduled Tribe)' },
                  { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
                  { value: 'MINORITY', label: 'Notified Minority Community' },
                ]}
                value={formData.socialCategory}
                onChange={(e) => handleInputChange('socialCategory', e.target.value as SocialCategory)}
                required
                whyWeAsk="Determines eligibility for dedicated welfare departments (e.g., SSP SC/ST/OBC/Minority schemes)."
              />

              {['OBC', 'SC', 'ST', 'EWS'].includes(formData.socialCategory) && (
                <div className="p-3 bg-paper-muted border border-line rounded-md space-y-3">
                  <Input
                    label="Sub-Category / Caste Name"
                    placeholder="e.g. Category 2A / 3B / Vankar / Valmiki"
                    value={formData.subCategory || ''}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    whyWeAsk="Specific state fee waivers apply to sub-categories published in government notifications."
                  />

                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.casteCertificateAvailable}
                      onChange={(e) => handleInputChange('casteCertificateAvailable', e.target.checked)}
                      className="rounded border-line text-ink"
                    />
                    <span>Possess valid RD Caste / Community Certificate</span>
                  </label>
                </div>
              )}

              <div className="p-3.5 bg-paper-surface border border-line rounded-md space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMinority}
                    onChange={(e) => handleInputChange('isMinority', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Belong to a Notified Religious Minority Community</span>
                </label>

                {formData.isMinority && (
                  <Select
                    label="Minority Community"
                    options={[
                      { value: 'MUSLIM', label: 'Muslim' },
                      { value: 'CHRISTIAN', label: 'Christian' },
                      { value: 'SIKH', label: 'Sikh' },
                      { value: 'BUDDHIST', label: 'Buddhist' },
                      { value: 'JAIN', label: 'Jain' },
                      { value: 'PARSI', label: 'Parsi / Zoroastrian' },
                    ]}
                    value={formData.minorityCommunity || 'MUSLIM'}
                    onChange={(e) => handleInputChange('minorityCommunity', e.target.value as StudentProfile['minorityCommunity'])}
                    whyWeAsk="Schemes like Begum Hazrat Mahal require membership in notified minority communities."
                  />
                )}
              </div>

              <div className="p-3.5 bg-paper-surface border border-line rounded-md space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPersonWithDisability}
                    onChange={(e) => handleInputChange('isPersonWithDisability', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Person with Disability (PwD)</span>
                </label>

                {formData.isPersonWithDisability && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Input
                      label="Benchmark Disability (%)"
                      type="number"
                      placeholder="e.g. 40"
                      value={formData.disabilityPercentage || ''}
                      onChange={(e) => handleInputChange('disabilityPercentage', parseFloat(e.target.value) || 0)}
                      whyWeAsk="Government PwD reservations strictly require 40% or higher benchmark disability."
                    />
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.disabilityCertificateAvailable}
                          onChange={(e) => handleInputChange('disabilityCertificateAvailable', e.target.checked)}
                          className="rounded border-line text-ink"
                        />
                        <span>Medical Disability Certificate Available</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 3 — EDUCATION */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Educational level, enrolled institution, degree, and academic performance history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Current Education Level"
                options={[
                  { value: 'CLASS_10', label: 'Class 10 (Secondary)' },
                  { value: 'CLASS_12_PUC', label: 'Class 11-12 / PUC' },
                  { value: 'DIPLOMA', label: 'Polytechnic / Diploma' },
                  { value: 'UNDERGRADUATE', label: 'Undergraduate (BE/BTech, BSc, BCom, BA)' },
                  { value: 'POSTGRADUATE', label: 'Postgraduate (ME/MTech, MSc, MBA)' },
                  { value: 'PHD_RESEARCH', label: 'PhD / Post-Doctoral' },
                ]}
                value={formData.educationLevel}
                onChange={(e) => handleInputChange('educationLevel', e.target.value as EducationLevel)}
                required
                whyWeAsk="Scholarship guidelines restrict eligibility strictly by level of study."
              />

              <SearchableSelect
                label="College / Institution"
                options={collegeOptions}
                value={formData.collegeId}
                onChange={(val, opt) => {
                  handleInputChange('collegeId', val);
                  if (opt) {
                    handleInputChange('collegeName', opt.label);
                    const matchedCollege = VERIFIED_COLLEGES.find((c) => c.id === val);
                    if (matchedCollege) {
                      handleInputChange('university', matchedCollege.university);
                      handleInputChange('collegeState', matchedCollege.state);
                    }
                  }
                }}
                placeholder="Search accredited colleges (e.g. RVCE, BMSCE, PESU)..."
                whyWeAsk="Institution AISHE registration code verification is mandatory for disbursement."
              />

              <SearchableSelect
                label="Degree & Course"
                options={degreeOptions}
                value={formData.degreeName}
                onChange={(_val, opt) => {
                  if (opt) {
                    const parts = opt.label.split(' - ');
                    handleInputChange('degreeName', parts[0]);
                    handleInputChange('courseName', parts[1] || parts[0]);
                    handleInputChange('branch', parts[1] || parts[0]);
                  }
                }}
                placeholder="Search degree & course (e.g. B.E. - Computer Science)..."
                whyWeAsk="Technical courses (B.E./B.Tech) qualify for AICTE specialized grants."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Year of Study"
                  options={[
                    { value: '1', label: '1st Year' },
                    { value: '2', label: '2nd Year' },
                    { value: '3', label: '3rd Year' },
                    { value: '4', label: '4th Year' },
                    { value: '5', label: '5th Year' },
                  ]}
                  value={formData.yearOfStudy.toString()}
                  onChange={(e) => handleInputChange('yearOfStudy', parseInt(e.target.value, 10))}
                  required
                />

                <Input
                  label="Admission Year"
                  type="number"
                  placeholder="e.g. 2024"
                  value={formData.admissionYear || ''}
                  onChange={(e) => handleInputChange('admissionYear', parseInt(e.target.value, 10) || undefined)}
                />

                <Select
                  label="Institution Type"
                  options={[
                    { value: 'GOVERNMENT', label: 'Government' },
                    { value: 'AIDED', label: 'Government Aided' },
                    { value: 'PRIVATE', label: 'Private Self-Financed' },
                    { value: 'DEEMED', label: 'Deemed / Autonomous' },
                  ]}
                  value={formData.institutionType || 'AIDED'}
                  onChange={(e) => handleInputChange('institutionType', e.target.value as StudentProfile['institutionType'])}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  label="Academic Marks / Score (% or CGPA)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 88.0"
                  value={formData.percentageOrCgpa}
                  onChange={(e) => handleInputChange('percentageOrCgpa', parseFloat(e.target.value) || 0)}
                  required
                  whyWeAsk="Merit schemes (e.g. Central Sector) require cutoff score in previous Board exam (e.g. >= 80%)."
                />

                <Input
                  label="Previous Year Percentage (%)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 86.5"
                  value={formData.previousAcademicPercentage || ''}
                  onChange={(e) => handleInputChange('previousAcademicPercentage', parseFloat(e.target.value) || undefined)}
                  whyWeAsk="Renewal applications require passing previous academic year without backlogs."
                />
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 4 — FINANCIAL */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Financial Status & Household Income</CardTitle>
              <CardDescription>
                Annual family income ceilings published by state and central welfare ministries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Annual Family Income (INR ₹)"
                type="number"
                placeholder="e.g. 200000"
                value={formData.annualFamilyIncome}
                onChange={(e) => handleInputChange('annualFamilyIncome', parseInt(e.target.value, 10) || 0)}
                required
                whyWeAsk="Published Income Caps: ₹2.0L (Minorities), ₹2.5L (OBC/SSP), ₹4.5L (NSP Central), ₹8.0L (AICTE Pragati)."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Primary Family Income Source"
                  options={[
                    { value: 'Salaried / Private Service', label: 'Salaried / Private Employment' },
                    { value: 'Government Service', label: 'Government Employment' },
                    { value: 'Agriculture / Farming', label: 'Agriculture / Farming' },
                    { value: 'Business / Self-Employed', label: 'Small Business / Self-Employed' },
                    { value: 'Daily Wage Worker', label: 'Daily Wage / Informal Sector' },
                    { value: 'Pension / Other', label: 'Pension / Other' },
                  ]}
                  value={formData.incomeSource || 'Salaried / Private Service'}
                  onChange={(e) => handleInputChange('incomeSource', e.target.value)}
                />

                <Input
                  label="Household Size (Members)"
                  type="number"
                  placeholder="e.g. 4"
                  value={formData.familySize || 4}
                  onChange={(e) => handleInputChange('familySize', parseInt(e.target.value, 10) || 4)}
                />
              </div>

              <div className="p-4 bg-paper-surface border border-line rounded-md space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasIncomeCertificate}
                    onChange={(e) => handleInputChange('hasIncomeCertificate', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Possess Revenue Department Income Certificate (RD Number)</span>
                </label>

                {formData.hasIncomeCertificate && (
                  <Input
                    label="Income Certificate Validity Period"
                    placeholder="e.g. 2026-2031 (5 Year Validity)"
                    value={formData.incomeCertificateValidity || ''}
                    onChange={(e) => handleInputChange('incomeCertificateValidity', e.target.value)}
                    whyWeAsk="Karnataka Revenue Department income certificates are valid for 5 financial years."
                  />
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 5 — RESIDENCY */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle>Residency & Domicile</CardTitle>
              <CardDescription>
                State domicile criteria determine eligibility for state welfare portals (e.g. SSP Karnataka).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="State of Permanent Domicile"
                options={INDIAN_STATES}
                value={formData.domicileState}
                onChange={(e) => handleInputChange('domicileState', e.target.value)}
                required
                whyWeAsk="State fee waiver schemes require verifiable permanent residency in the awarding state."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Current State of Residence"
                  options={INDIAN_STATES}
                  value={formData.currentState || formData.domicileState}
                  onChange={(e) => handleInputChange('currentState', e.target.value)}
                />

                <Input
                  label="Current District"
                  placeholder="e.g. Bengaluru Urban, Mysuru, Pune"
                  value={formData.currentDistrict}
                  onChange={(e) => handleInputChange('currentDistrict', e.target.value)}
                  required
                />
              </div>

              <Select
                label="Habitation Region Type"
                options={[
                  { value: 'URBAN', label: 'Urban (City / Municipal Corporation)' },
                  { value: 'RURAL', label: 'Rural (Panchayat / Village)' },
                ]}
                value={formData.urbanRural}
                onChange={(e) => handleInputChange('urbanRural', e.target.value as 'URBAN' | 'RURAL')}
                whyWeAsk="Rural background schemes grant additional maintenance allowances for hostel stays."
              />
            </CardContent>
          </>
        )}

        {/* STEP 6 — SPECIAL ELIGIBILITY (DYNAMIC CONDITIONAL QUESTIONS) */}
        {currentStep === 6 && (
          <>
            <CardHeader>
              <CardTitle>Smart Special Eligibility</CardTitle>
              <CardDescription>
                Tailored conditions presented based on your profile inputs. No irrelevant questions asked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conditional warning if income cert is missing */}
              {!formData.hasIncomeCertificate && (
                <div className="p-3.5 bg-gold-surface border border-gold/40 rounded-md text-xs text-ink flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Income Certificate Verification Notice</p>
                    <p className="text-ink/80 leading-relaxed">
                      You indicated that you do not possess an RD Income Certificate yet. Some state fee waiver schemes (e.g. SSP) require verified Tahsildar metadata. You can continue onboarding now and update document metadata later.
                    </p>
                  </div>
                </div>
              )}

              {/* Gender specific condition */}
              {formData.gender === 'FEMALE' && (
                <div className="p-3.5 bg-paper-surface border border-line rounded-md space-y-2">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-green" /> Female Student Specific Schemes
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isGirlChildOnly}
                      onChange={(e) => handleInputChange('isGirlChildOnly', e.target.checked)}
                      className="rounded border-line text-ink"
                    />
                    <span>Single Girl Child in household (Qualifies for AICTE Pragati & UGC Single Girl Child scheme)</span>
                  </label>
                </div>
              )}

              {/* General Special Conditions Checkboxes */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Special Household Circumstances</p>
                
                <label className="flex items-center gap-2 p-3 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isFirstGenerationLearner}
                    onChange={(e) => handleInputChange('isFirstGenerationLearner', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>First-Generation Higher Education Learner in Family (Parents have not completed university degree)</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isSingleParentChild}
                    onChange={(e) => handleInputChange('isSingleParentChild', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Single-Parent Household / Raised by Single Mother</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isOrphan}
                    onChange={(e) => handleInputChange('isOrphan', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Orphan / Ward of Government Institution</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isDefenceBackground}
                    onChange={(e) => handleInputChange('isDefenceBackground', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Child of Armed Forces / Ex-Servicemen / Paramilitary Personnel</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isHosteller}
                    onChange={(e) => handleInputChange('isHosteller', e.target.checked)}
                    className="rounded border-line text-ink"
                  />
                  <span>Residing in College Hostel / Approved PG (Qualifies for Vidyasiri & Hostel Maintenance Allowances)</span>
                </label>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 7 — DOCUMENT READINESS */}
        {currentStep === 7 && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <StatusBadge status="READY" size="sm" customLabel="Passport Audit Mode" />
                <span className="text-xs text-muted font-medium">Metadata Only · Zero Raw Files</span>
              </div>
              <CardTitle className="mt-2">Supporting Document Readiness</CardTitle>
              <CardDescription>
                Mark the readiness status of your certificate metadata to identify any verification gaps beforehand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-paper-muted border border-line rounded-md text-xs text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green shrink-0" />
                <span>
                  ScholarPath Passport records reference numbers and validity dates locally. Actual document files are never uploaded in this MVP.
                </span>
              </div>

              <div className="space-y-3">
                {STANDARD_DOC_TYPES.map((docDef) => {
                  const currentStatus = getDocStatus(docDef.type);
                  return (
                    <div
                      key={docDef.type}
                      className="p-3.5 bg-paper-surface border border-line rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-ink">{docDef.name}</p>
                        <p className="text-[11px] text-muted">Issuer: {docDef.issuer}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDocumentStatusChange(docDef.type, 'VERIFIED')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors ${
                            currentStatus === 'VERIFIED'
                              ? 'bg-green text-paper border-green'
                              : 'bg-paper-surface text-muted border-line hover:text-ink'
                          }`}
                        >
                          ✓ Available
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocumentStatusChange(docDef.type, 'NEEDS_VERIFICATION')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors ${
                            currentStatus === 'NEEDS_VERIFICATION'
                              ? 'bg-gold-surface text-ink border-gold'
                              : 'bg-paper-surface text-muted border-line hover:text-ink'
                          }`}
                        >
                          ! Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocumentStatusChange(docDef.type, 'MISSING')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors ${
                            currentStatus === 'MISSING'
                              ? 'bg-paper-muted text-ink border-line-dark'
                              : 'bg-paper-surface text-muted border-line hover:text-ink'
                          }`}
                        >
                          ○ Missing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation Controls Footer */}
        <CardFooter className="flex items-center justify-between border-t border-line pt-4 mt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 7 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              variant="gold"
              size="lg"
              onClick={handleFinishWizard}
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Profile & Calculate Matches
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

