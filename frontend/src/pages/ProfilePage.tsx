import React, { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { StudentProfile, SocialCategory, EducationLevel } from '../types/profile';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  Wallet, 
  MapPin, 
  Award,
  FileCheck,
  Heart,
  X,
  Save
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, completionStats, recalculateEligibility, updateProfile } = useProfile();

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [tempProfile, setTempProfile] = useState<StudentProfile>({ ...profile });

  const handleRecalculate = () => {
    recalculateEligibility();
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4500);
  };

  const startEditing = (section: string) => {
    setTempProfile({ ...profile });
    setEditingSection(section);
  };

  const cancelEditing = () => {
    setEditingSection(null);
  };

  const saveSection = () => {
    updateProfile(tempProfile);
    setEditingSection(null);
    handleRecalculate();
  };

  const getSectionStatus = (pass: boolean, needsVerification?: boolean) => {
    if (needsVerification) return <StatusBadge status="NEEDS_VERIFICATION" size="sm" customLabel="Needs Verification" />;
    if (pass) return <StatusBadge status="READY" size="sm" customLabel="Complete" />;
    return <StatusBadge status="MISSING" size="sm" customLabel="Incomplete" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile & Eligibility DNA"
        subtitle="Your profile is the single source of truth used for evaluating official scholarship criteria."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={handleRecalculate}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Recalculate Eligibility
            </Button>
            <Link to="/wizard">
              <Button size="sm" variant="outline" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                Launch 7-Step Wizard
              </Button>
            </Link>
          </div>
        }
      />

      {/* Recalculate Toast Banner */}
      {showNotification && (
        <div className="p-3.5 bg-green-surface border border-green/30 text-green rounded-md text-xs font-semibold flex items-center justify-between animate-fade-in shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Eligibility updated using your latest profile! Matches refreshed on Dashboard and Explore.</span>
          </div>
          <button type="button" onClick={() => setShowNotification(false)} className="text-green hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Profile Completeness Snapshot Header */}
      <Card variant="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={completionStats.isComplete ? 'ELIGIBLE' : 'NEEDS_VERIFICATION'}
                size="sm"
                customLabel={completionStats.isComplete ? 'Profile Complete' : 'Incomplete'}
              />
              <span className="text-xs font-bold text-ink">{completionStats.percentage}% Completeness Score</span>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-xl">
              {completionStats.isComplete
                ? 'Your Eligibility DNA profile is complete and actively powering deterministic scheme matching.'
                : `Complete your profile to unlock more accurate scholarship matches. Missing: ${completionStats.missingFields.join(', ')}.`}
            </p>
          </div>
          <div className="w-full sm:w-48 bg-line h-2.5 rounded-full overflow-hidden shrink-0">
            <div
              className="bg-ink h-full rounded-full transition-all duration-300"
              style={{ width: `${completionStats.percentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Grid of Editable Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Personal Identification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Personal Identification</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.personal)}
                <button
                  type="button"
                  onClick={() => (editingSection === 'personal' ? cancelEditing() : startEditing('personal'))}
                  className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {editingSection === 'personal' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'personal' ? (
              <div className="space-y-3 pt-1">
                <Input
                  label="Full Name"
                  value={tempProfile.fullName}
                  onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={tempProfile.dob}
                  onChange={(e) => setTempProfile({ ...tempProfile, dob: e.target.value, dateOfBirth: e.target.value })}
                />
                <Select
                  label="Gender"
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                  ]}
                  value={tempProfile.gender}
                  onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value as StudentProfile['gender'] })}
                />
                <Input
                  label="Email"
                  value={tempProfile.email || ''}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  value={tempProfile.phoneNumber || ''}
                  onChange={(e) => setTempProfile({ ...tempProfile, phoneNumber: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">Full Name:</span><span className="font-semibold text-ink">{profile.fullName}</span></div>
                <div className="flex justify-between"><span className="text-muted">Date of Birth:</span><span className="font-semibold text-ink">{profile.dob}</span></div>
                <div className="flex justify-between"><span className="text-muted">Gender:</span><span className="font-semibold text-ink">{profile.gender}</span></div>
                {profile.email && <div className="flex justify-between"><span className="text-muted">Email:</span><span className="font-semibold text-ink">{profile.email}</span></div>}
                {profile.phoneNumber && <div className="flex justify-between"><span className="text-muted">Phone:</span><span className="font-semibold text-ink">{profile.phoneNumber}</span></div>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Academic Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Academic Information</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.academic)}
                <button
                  type="button"
                  onClick={() => (editingSection === 'academic' ? cancelEditing() : startEditing('academic'))}
                  className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {editingSection === 'academic' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'academic' ? (
              <div className="space-y-3 pt-1">
                <Select
                  label="Education Level"
                  options={[
                    { value: 'CLASS_10', label: 'Class 10' },
                    { value: 'CLASS_12_PUC', label: 'Class 12 / PUC' },
                    { value: 'DIPLOMA', label: 'Diploma' },
                    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
                    { value: 'POSTGRADUATE', label: 'Postgraduate' },
                    { value: 'PHD_RESEARCH', label: 'PhD / Research' },
                  ]}
                  value={tempProfile.educationLevel}
                  onChange={(e) => setTempProfile({ ...tempProfile, educationLevel: e.target.value as EducationLevel })}
                />
                <Input
                  label="College Name"
                  value={tempProfile.collegeName}
                  onChange={(e) => setTempProfile({ ...tempProfile, collegeName: e.target.value })}
                />
                <Input
                  label="Degree Name"
                  value={tempProfile.degreeName}
                  onChange={(e) => setTempProfile({ ...tempProfile, degreeName: e.target.value })}
                />
                <Input
                  label="Course / Branch"
                  value={tempProfile.courseName}
                  onChange={(e) => setTempProfile({ ...tempProfile, courseName: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Year of Study"
                    type="number"
                    value={tempProfile.yearOfStudy}
                    onChange={(e) => setTempProfile({ ...tempProfile, yearOfStudy: parseInt(e.target.value, 10) || 1 })}
                  />
                  <Input
                    label="Academic Score (%)"
                    type="number"
                    step="0.1"
                    value={tempProfile.percentageOrCgpa}
                    onChange={(e) => setTempProfile({ ...tempProfile, percentageOrCgpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">Level / Degree:</span><span className="font-semibold text-ink">{profile.educationLevel} · {profile.degreeName}</span></div>
                <div className="flex justify-between"><span className="text-muted">Course / Branch:</span><span className="font-semibold text-ink truncate max-w-[200px]">{profile.courseName}</span></div>
                <div className="flex justify-between"><span className="text-muted">Institution:</span><span className="font-semibold text-ink truncate max-w-[200px]">{profile.collegeName}</span></div>
                <div className="flex justify-between"><span className="text-muted">Year of Study:</span><span className="font-semibold text-ink">{profile.yearOfStudy} Year</span></div>
                <div className="flex justify-between"><span className="text-muted">Marks / Percentile:</span><span className="font-semibold text-ink">{profile.percentageOrCgpa}%</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Financial Criteria */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Financial Criteria</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.financial, !profile.hasIncomeCertificate)}
                <button
                  type="button"
                  onClick={() => (editingSection === 'financial' ? cancelEditing() : startEditing('financial'))}
                  className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {editingSection === 'financial' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'financial' ? (
              <div className="space-y-3 pt-1">
                <Input
                  label="Annual Family Income (INR ₹)"
                  type="number"
                  value={tempProfile.annualFamilyIncome}
                  onChange={(e) => setTempProfile({ ...tempProfile, annualFamilyIncome: parseInt(e.target.value, 10) || 0 })}
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={tempProfile.hasIncomeCertificate}
                    onChange={(e) => setTempProfile({ ...tempProfile, hasIncomeCertificate: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Possess Valid Revenue Dept Income Certificate</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">Annual Family Income:</span><span className="font-bold text-ink">₹{profile.annualFamilyIncome.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted">Income Certificate:</span><span className="font-semibold text-green">{profile.hasIncomeCertificate ? 'Yes (Verified RD)' : 'Missing / Unverified'}</span></div>
                {profile.incomeSource && <div className="flex justify-between"><span className="text-muted">Income Source:</span><span className="font-semibold text-ink">{profile.incomeSource}</span></div>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Residency & Domicile */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Residency & Domicile</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.residency)}
                <button
                  type="button"
                  onClick={() => (editingSection === 'residency' ? cancelEditing() : startEditing('residency'))}
                  className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {editingSection === 'residency' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'residency' ? (
              <div className="space-y-3 pt-1">
                <Input
                  label="Permanent Domicile State"
                  value={tempProfile.domicileState}
                  onChange={(e) => setTempProfile({ ...tempProfile, domicileState: e.target.value })}
                />
                <Input
                  label="Current District"
                  value={tempProfile.currentDistrict}
                  onChange={(e) => setTempProfile({ ...tempProfile, currentDistrict: e.target.value })}
                />
                <Select
                  label="Area Type"
                  options={[
                    { value: 'URBAN', label: 'Urban' },
                    { value: 'RURAL', label: 'Rural' },
                  ]}
                  value={tempProfile.urbanRural}
                  onChange={(e) => setTempProfile({ ...tempProfile, urbanRural: e.target.value as 'URBAN' | 'RURAL' })}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">State Domicile:</span><span className="font-semibold text-ink">{profile.domicileState}</span></div>
                <div className="flex justify-between"><span className="text-muted">District:</span><span className="font-semibold text-ink">{profile.currentDistrict} ({profile.urbanRural})</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Social Category & Quotas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Social Category & Quotas</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.social)}
                <button
                  type="button"
                  onClick={() => (editingSection === 'social' ? cancelEditing() : startEditing('social'))}
                  className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {editingSection === 'social' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'social' ? (
              <div className="space-y-3 pt-1">
                <Select
                  label="Social Category"
                  options={[
                    { value: 'GENERAL', label: 'General' },
                    { value: 'OBC', label: 'OBC' },
                    { value: 'SC', label: 'SC' },
                    { value: 'ST', label: 'ST' },
                    { value: 'EWS', label: 'EWS' },
                    { value: 'MINORITY', label: 'Minority' },
                  ]}
                  value={tempProfile.socialCategory}
                  onChange={(e) => setTempProfile({ ...tempProfile, socialCategory: e.target.value as SocialCategory })}
                />
                <Input
                  label="Sub-Category"
                  value={tempProfile.subCategory || ''}
                  onChange={(e) => setTempProfile({ ...tempProfile, subCategory: e.target.value })}
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isMinority}
                    onChange={(e) => setTempProfile({ ...tempProfile, isMinority: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Religious Minority</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isPersonWithDisability}
                    onChange={(e) => setTempProfile({ ...tempProfile, isPersonWithDisability: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Person with Disability (PwD)</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">Category:</span><span className="font-semibold text-ink">{profile.socialCategory} ({profile.subCategory || 'General'})</span></div>
                <div className="flex justify-between"><span className="text-muted">Minority Status:</span><span className="font-semibold text-ink">{profile.isMinority ? `Yes (${profile.minorityCommunity || 'Notified'})` : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Disability Status:</span><span className="font-semibold text-ink">{profile.isPersonWithDisability ? `${profile.disabilityPercentage || 40}% PwD` : 'No'}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 6: Special Household Circumstances */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Special Conditions</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => (editingSection === 'special' ? cancelEditing() : startEditing('special'))}
                className="text-xs text-muted hover:text-ink underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {editingSection === 'special' ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {editingSection === 'special' ? (
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isFirstGenerationLearner}
                    onChange={(e) => setTempProfile({ ...tempProfile, isFirstGenerationLearner: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>First-Generation Learner</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isSingleParentChild}
                    onChange={(e) => setTempProfile({ ...tempProfile, isSingleParentChild: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Single Parent Household</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isOrphan}
                    onChange={(e) => setTempProfile({ ...tempProfile, isOrphan: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Orphan / Ward of State</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempProfile.isHosteller}
                    onChange={(e) => setTempProfile({ ...tempProfile, isHosteller: e.target.checked })}
                    className="rounded border-line text-ink"
                  />
                  <span>Hostel Resident</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={saveSection} leftIcon={<Save className="w-3.5 h-3.5" />}>Save & Recalculate</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted">First-Gen Learner:</span><span className="font-semibold text-ink">{profile.isFirstGenerationLearner ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Single Parent:</span><span className="font-semibold text-ink">{profile.isSingleParentChild ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Orphan:</span><span className="font-semibold text-ink">{profile.isOrphan ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Hosteller:</span><span className="font-semibold text-ink">{profile.isHosteller ? 'Yes' : 'No'}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 7: Document Passport Metadata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-ink shrink-0" />
                <CardTitle className="text-base">Document Readiness Passport</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {getSectionStatus(completionStats.sectionScores.documents)}
                <Link to="/passport">
                  <Button size="sm" variant="outline">Manage Metadata</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-muted">Metadata Records:</span>
              <span className="font-bold text-ink">{profile.documents?.length || 0} Certificates Registered</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(profile.documents || []).map((doc) => (
                <div key={doc.id} className="p-2.5 bg-paper-surface border border-line rounded flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink">{doc.documentName}</p>
                    <p className="text-[10px] text-muted">{doc.issuer}</p>
                  </div>
                  <StatusBadge status={doc.verificationStatus === 'VERIFIED' ? 'READY' : 'VERIFY'} size="sm" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

