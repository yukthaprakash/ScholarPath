import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { StudentProfile, EducationLevel, SocialCategory } from '../types/profile';
import { PassportDocument, DocumentType, AvailabilityStatus, VerificationStatus } from '../types/passport';
import { VERIFIED_COLLEGES, VERIFIED_DEGREES, INDIAN_STATES, KARNATAKA_DISTRICTS } from '../fixtures/verifiedColleges';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Info,
  BookmarkCheck,
  Check,
  FileText
} from 'lucide-react';

interface StandardDocDef {
  type: DocumentType;
  name: string;
  issuer: string;
  defaultRefPrefix: string;
}

const STANDARD_DOC_TYPES: StandardDocDef[] = [
  { type: 'INCOME_CERTIFICATE', name: 'Income Certificate', issuer: 'Revenue Dept (Tahsildar)', defaultRefPrefix: 'RD' },
  { type: 'CASTE_CERTIFICATE', name: 'Caste Certificate', issuer: 'Revenue Dept / Welfare Dept', defaultRefPrefix: 'RD' },
  { type: 'DOMICILE_CERTIFICATE', name: 'State Domicile Certificate', issuer: 'Tahsildar / Municipal Office', defaultRefPrefix: 'DOM' },
  { type: 'MARKS_CARD_12TH', name: 'Class 12 / PUC Marksheet', issuer: 'State Pre-University Board / CBSE', defaultRefPrefix: 'PUC' },
  { type: 'MARKS_CARD_PREVIOUS_SEM', name: 'Previous Semester Marksheet', issuer: 'University Examination Registrar', defaultRefPrefix: 'SEM' },
  { type: 'BONAFIDE_CERTIFICATE', name: 'College Bonafide Study Certificate', issuer: 'College Principal', defaultRefPrefix: 'BON' },
  { type: 'BANK_PASSBOOK_SEEDED', name: 'Bank Passbook (Aadhaar Seeded)', issuer: 'Nationalized Bank', defaultRefPrefix: 'A/C' },
];

export const WizardPage: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<StudentProfile>(() => ({ ...profile }));
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [saveLaterToast, setSaveLaterToast] = useState(false);

  // Manual entry toggle states
  const [isManualCollege, setIsManualCollege] = useState<boolean>(!!formData.isCustomInstitution);
  const [isManualCourse, setIsManualCourse] = useState<boolean>(!!formData.isCustomCourse);

  // College dropdown options with "Other"
  const collegeOptions = [
    ...VERIFIED_COLLEGES.map((c) => ({
      value: c.id,
      label: c.name,
      subLabel: `${c.university} · ${c.district}, ${c.state}`,
    })),
    {
      value: 'OTHER_COLLEGE',
      label: 'Other / Enter Manually',
      subLabel: 'Specify non-listed college or institution',
    },
  ];

  // Degree options with "Other"
  const degreeOptions = [
    ...VERIFIED_DEGREES.map((d) => ({
      value: d.id,
      label: `${d.degreeName} - ${d.courseName}`,
      subLabel: `Level: ${d.level}`,
    })),
    {
      value: 'OTHER_DEGREE',
      label: 'Other / Enter Manually',
      subLabel: 'Specify non-listed course or degree',
    },
  ];

  const stateOptions = INDIAN_STATES.map((s) => ({ value: s, label: s }));
  const districtOptions = KARNATAKA_DISTRICTS.map((d) => ({ value: d, label: d }));

  const handleInputChange = <K extends keyof StudentProfile>(field: K, value: StudentProfile[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field if present
    if (stepErrors[field as string]) {
      setStepErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    }
  };

  const handleDocumentStatusChange = (
    docType: DocumentType,
    availability: AvailabilityStatus,
    customRef?: string
  ) => {
    const existingDocs = [...(formData.documents || [])];
    const index = existingDocs.findIndex((d) => d.documentType === docType);

    const defaultInfo = STANDARD_DOC_TYPES.find((d) => d.type === docType);
    const name = defaultInfo ? defaultInfo.name : docType.replace(/_/g, ' ');
    const issuer = defaultInfo ? defaultInfo.issuer : 'Authorized Issuing Authority';

    const verificationStatus: VerificationStatus =
      availability === 'AVAILABLE' ? 'VERIFIED' :
      availability === 'NEEDS_VERIFICATION' ? 'NEEDS_VERIFICATION' :
      'MISSING';

    const refNum = customRef !== undefined
      ? customRef
      : index >= 0 && existingDocs[index].referenceNumber
      ? existingDocs[index].referenceNumber
      : availability === 'AVAILABLE'
      ? `${defaultInfo?.defaultRefPrefix || 'DOC'}${Math.floor(10000000 + Math.random() * 90000000)}`
      : '';

    if (index >= 0) {
      existingDocs[index] = {
        ...existingDocs[index],
        availabilityStatus: availability,
        verificationStatus,
        referenceNumber: refNum,
      };
    } else {
      const newDoc: PassportDocument = {
        id: `doc-${docType.toLowerCase()}-${Date.now()}`,
        documentType: docType,
        documentName: name,
        issuer: issuer,
        issueDate: '2026-05-01',
        validityYear: '2026-27',
        referenceNumber: refNum,
        availabilityStatus: availability,
        verificationStatus,
        academicYear: formData.academicYear || '2026-27',
      };
      existingDocs.push(newDoc);
    }

    setFormData((prev) => ({
      ...prev,
      documents: existingDocs,
    }));
  };

  const getDocRecord = (docType: DocumentType): PassportDocument | undefined => {
    return (formData.documents || []).find((d) => d.documentType === docType);
  };

  // Step Validation Logic
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName || formData.fullName.trim().length < 2) {
        errors.fullName = 'Please enter your full official name.';
      }
      if (!formData.dob && !formData.dateOfBirth) {
        errors.dob = 'Please provide your date of birth.';
      }
      if (!formData.gender || formData.gender === 'PREFER_NOT_TO_SAY') {
        errors.gender = 'Please select a gender option to evaluate scheme criteria.';
      }
    } else if (currentStep === 2) {
      if (!formData.socialCategory || formData.socialCategory === 'NOT_DISCLOSED') {
        errors.socialCategory = 'Please select your social category.';
      }
    } else if (currentStep === 3) {
      if (!formData.educationLevel) {
        errors.educationLevel = 'Please select your current education level.';
      }
      if (!formData.collegeName || formData.collegeName.trim().length === 0) {
        errors.collegeName = 'Please select or enter your college/institution.';
      }
      if (!formData.degreeName || formData.degreeName.trim().length === 0) {
        errors.degreeName = 'Please select or enter your degree/course.';
      }
      if (!formData.percentageOrCgpa || formData.percentageOrCgpa <= 0) {
        errors.percentageOrCgpa = 'Please enter your academic percentage or CGPA.';
      } else if (formData.percentageOrCgpa > 100) {
        errors.percentageOrCgpa = 'Percentage cannot exceed 100%.';
      }
    } else if (currentStep === 4) {
      if (formData.annualFamilyIncome === undefined || formData.annualFamilyIncome < 0) {
        errors.annualFamilyIncome = 'Please provide a valid annual family income.';
      }
    } else if (currentStep === 5) {
      if (!formData.domicileState) {
        errors.domicileState = 'Please select your state of permanent domicile.';
      }
      if (!formData.currentDistrict || formData.currentDistrict.trim().length === 0) {
        errors.currentDistrict = 'Please provide your district.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 7) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAndContinueLater = () => {
    updateProfile(formData);
    setSaveLaterToast(true);
    setTimeout(() => {
      navigate('/home');
    }, 1200);
  };

  const handleFinishWizard = () => {
    if (validateCurrentStep()) {
      updateProfile(formData);
      navigate('/home');
    }
  };

  const stepTitles = [
    'About You',
    'Social & Category',
    'Academic Details',
    'Financial Status',
    'Residency & Domicile',
    'Special Circumstances',
    'Document Readiness',
  ];

  const stepSubtitles = [
    'Official demographic information used across NSP and state scholarship portals.',
    'Category and quota classifications for government welfare schemes.',
    'Enrolled institution, degree program, and verified academic performance.',
    'Annual household income ceilings published by welfare ministries.',
    'Permanent state domicile and district residence criteria.',
    'Scheme-specific conditions tailored strictly to your profile.',
    'Supporting certificate metadata audit (no raw file uploads required).',
  ];

  const progressPercentage = Math.round((currentStep / 7) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2 sm:py-6 px-1">
      <PageHeader
        title="Eligibility DNA Setup"
        subtitle={`Step ${currentStep} of 7: ${stepTitles[currentStep - 1]}. ${stepSubtitles[currentStep - 1]}`}
        backHref="/home"
        backLabel="Dashboard"
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSaveAndContinueLater}
            leftIcon={<BookmarkCheck className="w-3.5 h-3.5" />}
          >
            Save & Continue Later
          </Button>
        }
      />

      {/* Save Later Confirmation Banner */}
      {saveLaterToast && (
        <div className="p-3 bg-green-surface border border-green/30 text-green rounded-md text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-subtle">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Progress saved successfully! You can resume this wizard anytime from your dashboard.</span>
        </div>
      )}

      {/* Visual Progress Bar & Step Tracker */}
      <div
        className="space-y-2 bg-paper-surface p-4 border border-line rounded-lg shadow-subtle"
        role="region"
        aria-label="Onboarding Progress"
      >
        <div className="flex items-center justify-between text-xs font-bold text-ink">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full bg-ink text-paper text-[11px] flex items-center justify-center font-bold"
              aria-hidden="true"
            >
              {currentStep}
            </span>
            Step {currentStep} of 7 — {stepTitles[currentStep - 1]}
          </span>
          <span className="text-muted">{progressPercentage}% Complete</span>
        </div>
        <div
          className="w-full bg-line h-2.5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
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
                Official demographic information used across NSP, SSP, and national welfare portals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name (as in Aadhaar / Official Marksheet)"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                error={stepErrors.fullName}
                whyWeAsk="Scheme portals require exact name matching across Aadhaar, bank accounts, and certificates to avoid rejection."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob || formData.dateOfBirth || ''}
                  onChange={(e) => {
                    handleInputChange('dob', e.target.value);
                    handleInputChange('dateOfBirth', e.target.value);
                  }}
                  required
                  error={stepErrors.dob}
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
                  error={stepErrors.gender}
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
                  whyWeAsk="Used for application deadline reminders and status change notifications."
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
                  { value: 'OTHER', label: 'Other Classification' },
                ]}
                value={formData.socialCategory}
                onChange={(e) => handleInputChange('socialCategory', e.target.value as SocialCategory)}
                required
                error={stepErrors.socialCategory}
                whyWeAsk="Determines eligibility for dedicated welfare departments (e.g., SSP SC/ST/OBC/Minority fee waiver schemes)."
              />

              {['OBC', 'SC', 'ST', 'EWS'].includes(formData.socialCategory) && (
                <div className="p-3.5 bg-paper-muted border border-line rounded-md space-y-3">
                  <Input
                    label="Sub-Category / Caste Name"
                    placeholder="e.g. Category 2A, 3B, Vankar, Valmiki"
                    value={formData.subCategory || ''}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    whyWeAsk="Specific state fee waivers apply to sub-categories published in government orders."
                  />

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={!!formData.casteCertificateAvailable}
                      onChange={(e) => handleInputChange('casteCertificateAvailable', e.target.checked)}
                      className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
                    />
                    <span>Possess valid Revenue Department Caste / Community Certificate</span>
                  </label>
                </div>
              )}

              <div className="p-3.5 bg-paper-surface border border-line rounded-md space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isMinority}
                    onChange={(e) => handleInputChange('isMinority', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
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
                <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isPersonWithDisability}
                    onChange={(e) => handleInputChange('isPersonWithDisability', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
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
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={!!formData.disabilityCertificateAvailable}
                          onChange={(e) => handleInputChange('disabilityCertificateAvailable', e.target.checked)}
                          className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
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

        {/* STEP 3 — ACADEMIC */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Educational institution, course/degree, study year, and academic performance history.
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
                  { value: 'PHD_RESEARCH', label: 'PhD / Post-Doctoral Research' },
                ]}
                value={formData.educationLevel}
                onChange={(e) => handleInputChange('educationLevel', e.target.value as EducationLevel)}
                required
                error={stepErrors.educationLevel}
                whyWeAsk="Scholarship guidelines restrict eligibility strictly by stage and level of study."
              />

              {/* Institution Selection */}
              <div className="space-y-2">
                {!isManualCollege ? (
                  <SearchableSelect
                    label="College / Institution"
                    options={collegeOptions}
                    value={formData.collegeId || (formData.collegeName ? 'OTHER_COLLEGE' : '')}
                    onChange={(val, opt) => {
                      if (val === 'OTHER_COLLEGE') {
                        setIsManualCollege(true);
                        handleInputChange('collegeId', undefined);
                        handleInputChange('isCustomInstitution', true);
                      } else {
                        handleInputChange('collegeId', val);
                        handleInputChange('isCustomInstitution', false);
                        if (opt) {
                          handleInputChange('collegeName', opt.label);
                          const matchedCollege = VERIFIED_COLLEGES.find((c) => c.id === val);
                          if (matchedCollege) {
                            handleInputChange('university', matchedCollege.university);
                            handleInputChange('collegeState', matchedCollege.state);
                          }
                        }
                      }
                    }}
                    placeholder="Search accredited colleges (e.g. RVCE, BMSCE, PESU)..."
                    required
                    error={stepErrors.collegeName}
                    whyWeAsk="Institution AISHE registration code verification is mandatory for scholarship disbursement."
                  />
                ) : (
                  <div className="p-3 bg-paper-muted border border-line rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Enter Institution Details Manually</span>
                      <button
                        type="button"
                        onClick={() => setIsManualCollege(false)}
                        className="text-xs text-muted hover:text-ink underline"
                      >
                        ← Back to verified catalogue
                      </button>
                    </div>
                    <Input
                      label="Institution / College Name"
                      placeholder="e.g. Government Engineering College"
                      value={formData.collegeName}
                      onChange={(e) => handleInputChange('collegeName', e.target.value)}
                      required
                      error={stepErrors.collegeName}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Affiliated University"
                        placeholder="e.g. VTU, Bangalore University"
                        value={formData.university || ''}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                      />
                      <Select
                        label="Institution State"
                        options={stateOptions}
                        value={formData.collegeState || formData.domicileState}
                        onChange={(e) => handleInputChange('collegeState', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                {!isManualCourse ? (
                  <SearchableSelect
                    label="Degree & Course"
                    options={degreeOptions}
                    value={formData.degreeName ? `${formData.degreeName} - ${formData.courseName}` : ''}
                    onChange={(val, opt) => {
                      if (val === 'OTHER_DEGREE') {
                        setIsManualCourse(true);
                        handleInputChange('isCustomCourse', true);
                      } else if (opt) {
                        handleInputChange('isCustomCourse', false);
                        const parts = opt.label.split(' - ');
                        handleInputChange('degreeName', parts[0]);
                        handleInputChange('courseName', parts[1] || parts[0]);
                        handleInputChange('branch', parts[1] || parts[0]);
                      }
                    }}
                    placeholder="Search degree & course (e.g. B.E. - Computer Science)..."
                    required
                    error={stepErrors.degreeName}
                    whyWeAsk="Technical courses (B.E./B.Tech) qualify for specialized AICTE national grants."
                  />
                ) : (
                  <div className="p-3 bg-paper-muted border border-line rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Enter Course Details Manually</span>
                      <button
                        type="button"
                        onClick={() => setIsManualCourse(false)}
                        className="text-xs text-muted hover:text-ink underline"
                      >
                        ← Back to standard degrees
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Degree Title"
                        placeholder="e.g. B.E., B.Sc., M.A."
                        value={formData.degreeName}
                        onChange={(e) => handleInputChange('degreeName', e.target.value)}
                        required
                        error={stepErrors.degreeName}
                      />
                      <Input
                        label="Course / Specialization"
                        placeholder="e.g. Artificial Intelligence & Data Science"
                        value={formData.courseName}
                        onChange={(e) => {
                          handleInputChange('courseName', e.target.value);
                          handleInputChange('branch', e.target.value);
                        }}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

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
                  value={formData.percentageOrCgpa || ''}
                  onChange={(e) => handleInputChange('percentageOrCgpa', parseFloat(e.target.value) || 0)}
                  required
                  error={stepErrors.percentageOrCgpa}
                  whyWeAsk="Merit schemes (e.g. Central Sector) require cutoff score in previous Board exam (e.g. >= 80%)."
                />

                <Input
                  label="Previous Year Score (%)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 86.5"
                  value={formData.previousAcademicPercentage || ''}
                  onChange={(e) => handleInputChange('previousAcademicPercentage', parseFloat(e.target.value) || undefined)}
                  whyWeAsk="Renewal applications require passing the previous academic year without backlogs."
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
                value={formData.annualFamilyIncome || ''}
                onChange={(e) => handleInputChange('annualFamilyIncome', parseInt(e.target.value, 10) || 0)}
                required
                error={stepErrors.annualFamilyIncome}
                whyWeAsk="Published Income Caps: ₹2.0L (Minorities), ₹2.5L (OBC/SSP), ₹4.5L (NSP Central), ₹8.0L (AICTE Pragati)."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Primary Household Income Source"
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
                <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.hasIncomeCertificate}
                    onChange={(e) => handleInputChange('hasIncomeCertificate', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
                  />
                  <span>Possess Revenue Department Income Certificate (with RD Number)</span>
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
                options={stateOptions}
                value={formData.domicileState}
                onChange={(e) => handleInputChange('domicileState', e.target.value)}
                required
                error={stepErrors.domicileState}
                whyWeAsk="State fee waiver schemes require verifiable permanent residency in the awarding state."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Current State of Residence"
                  options={stateOptions}
                  value={formData.currentState || formData.domicileState}
                  onChange={(e) => handleInputChange('currentState', e.target.value)}
                />

                {formData.domicileState === 'Karnataka' ? (
                  <Select
                    label="District"
                    options={districtOptions}
                    value={formData.currentDistrict}
                    onChange={(e) => handleInputChange('currentDistrict', e.target.value)}
                    required
                    error={stepErrors.currentDistrict}
                  />
                ) : (
                  <Input
                    label="District"
                    placeholder="e.g. Bengaluru Urban, Pune, Chennai"
                    value={formData.currentDistrict}
                    onChange={(e) => handleInputChange('currentDistrict', e.target.value)}
                    required
                    error={stepErrors.currentDistrict}
                  />
                )}
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

        {/* STEP 6 — SPECIAL CONDITIONS */}
        {currentStep === 6 && (
          <>
            <CardHeader>
              <CardTitle>Smart Special Circumstances</CardTitle>
              <CardDescription>
                Tailored criteria presented based on your profile inputs. Irrelevant questions are omitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conditional warning if income certificate is missing */}
              {!formData.hasIncomeCertificate && (
                <div className="p-3.5 bg-gold-surface border border-gold/40 rounded-md text-xs text-ink flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Income Certificate Advisory</p>
                    <p className="text-ink/80 leading-relaxed">
                      You indicated that you do not hold a verified RD Income Certificate yet. Most state fee waivers (SSP) evaluate Tahsildar metadata. You can complete onboarding now and add your RD number later in Certificate Passport.
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
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={formData.isGirlChildOnly}
                      onChange={(e) => handleInputChange('isGirlChildOnly', e.target.checked)}
                      className="w-4 h-4 rounded border-line text-ink focus:ring-ink"
                    />
                    <span>Single Girl Child in family (Qualifies for AICTE Pragati & UGC Single Girl Child scheme)</span>
                  </label>
                </div>
              )}

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Household Circumstances</p>

                <label className="flex items-center gap-2.5 p-3.5 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isFirstGenerationLearner}
                    onChange={(e) => handleInputChange('isFirstGenerationLearner', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink shrink-0"
                  />
                  <span>First-Generation Higher Education Learner (Parents have not completed a college degree)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isSingleParentChild}
                    onChange={(e) => handleInputChange('isSingleParentChild', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink shrink-0"
                  />
                  <span>Single-Parent Household / Raised by Single Mother</span>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isOrphan}
                    onChange={(e) => handleInputChange('isOrphan', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink shrink-0"
                  />
                  <span>Orphan / Ward of Government Institution</span>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isDefenceBackground}
                    onChange={(e) => handleInputChange('isDefenceBackground', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink shrink-0"
                  />
                  <span>Child of Armed Forces / Ex-Servicemen / Paramilitary Personnel</span>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-paper-surface border border-line rounded-md text-xs font-semibold text-ink cursor-pointer hover:bg-paper-muted/40 transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.isHosteller}
                    onChange={(e) => handleInputChange('isHosteller', e.target.checked)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-ink shrink-0"
                  />
                  <span>Residing in College Hostel / Approved PG (Qualifies for Vidyasiri & Hostel Maintenance Allowances)</span>
                </label>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 7 — DOCUMENT READINESS & FINAL REVIEW */}
        {currentStep === 7 && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <StatusBadge status="READY" size="sm" customLabel="Passport Audit Mode" />
                <span className="text-xs text-muted font-medium">Metadata Only · Zero Raw Files</span>
              </div>
              <CardTitle className="mt-2">Supporting Document Readiness & Review</CardTitle>
              <CardDescription>
                Record reference numbers and availability status. Final check before evaluating deterministic scheme matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-3 bg-paper-muted border border-line rounded-md text-xs text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green shrink-0" />
                <span>
                  ScholarPath Passport records reference numbers and validity dates locally. Actual document files are never uploaded in this MVP.
                </span>
              </div>

              {/* Certificate Metadata Controls */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-ink">Required Certificate Metadata</p>
                {STANDARD_DOC_TYPES.map((docDef) => {
                  const docRecord = getDocRecord(docDef.type);
                  const currentAvailability: AvailabilityStatus = docRecord?.availabilityStatus || (docRecord ? 'AVAILABLE' : 'MISSING');

                  return (
                    <div
                      key={docDef.type}
                      className="p-3.5 bg-paper-surface border border-line rounded-md space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-ink">{docDef.name}</p>
                          <p className="text-[11px] text-muted">Issuer: {docDef.issuer}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDocumentStatusChange(docDef.type, 'AVAILABLE')}
                            className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded border transition-colors ${
                              currentAvailability === 'AVAILABLE'
                                ? 'bg-green text-paper border-green'
                                : 'bg-paper-surface text-muted border-line hover:text-ink'
                            }`}
                          >
                            ✓ Available
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDocumentStatusChange(docDef.type, 'NEEDS_VERIFICATION')}
                            className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded border transition-colors ${
                              currentAvailability === 'NEEDS_VERIFICATION'
                                ? 'bg-gold-surface text-ink border-gold'
                                : 'bg-paper-surface text-muted border-line hover:text-ink'
                            }`}
                          >
                            ! Verify
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDocumentStatusChange(docDef.type, 'MISSING')}
                            className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded border transition-colors ${
                              currentAvailability === 'MISSING'
                                ? 'bg-paper-muted text-ink border-line-dark'
                                : 'bg-paper-surface text-muted border-line hover:text-ink'
                            }`}
                          >
                            ○ Missing
                          </button>
                        </div>
                      </div>

                      {currentAvailability !== 'MISSING' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-line/60">
                          <Input
                            label="Certificate / Reference Number"
                            placeholder="e.g. RD0038472918"
                            value={docRecord?.referenceNumber || ''}
                            onChange={(e) => handleDocumentStatusChange(docDef.type, currentAvailability, e.target.value)}
                          />
                          <Input
                            label="Validity / Academic Year"
                            placeholder="e.g. 2026-27 or Permanent"
                            value={docRecord?.validityYear || '2026-27'}
                            onChange={(e) => {
                              if (docRecord) {
                                const docs = (formData.documents || []).map((d) =>
                                  d.id === docRecord.id ? { ...d, validityYear: e.target.value } : d
                                );
                                setFormData({ ...formData, documents: docs });
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Review Summary Snapshot */}
              <div className="p-4 bg-paper-muted border border-line rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">Review Summary Before Saving</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">Full Name:</span>
                    <span className="font-semibold text-ink">{formData.fullName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Category:</span>
                    <span className="font-semibold text-ink">{formData.socialCategory || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Education:</span>
                    <span className="font-semibold text-ink">{formData.educationLevel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Institution:</span>
                    <span className="font-semibold text-ink truncate block max-w-[180px]">{formData.collegeName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Family Income:</span>
                    <span className="font-semibold text-ink">₹{(formData.annualFamilyIncome || 0).toLocaleString('en-IN')}/yr</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Domicile State:</span>
                    <span className="font-semibold text-ink">{formData.domicileState || '—'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation Controls Footer */}
        <CardFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-line pt-4 mt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAndContinueLater}
              className="min-h-[44px]"
            >
              Save Later
            </Button>

            {currentStep < 7 ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto min-h-[44px]"
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
                rightIcon={<Check className="w-4 h-4" />}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Save Profile & Calculate Matches
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
