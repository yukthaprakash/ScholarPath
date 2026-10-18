import React, { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { PassportDocument, DocumentType, AvailabilityStatus, VerificationStatus } from '../types/passport';
import { documentService } from '../services/profileService';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Plus,
  ShieldCheck,
  FileCheck,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';


const SUGGESTED_DOCUMENTS: { type: DocumentType; name: string; issuer: string; defaultRefPrefix: string }[] = [
  { type: 'INCOME_CERTIFICATE', name: 'Revenue Dept Income Certificate', issuer: 'Tahsildar, Revenue Dept', defaultRefPrefix: 'RD' },
  { type: 'CASTE_CERTIFICATE', name: 'Caste & Category Certificate', issuer: 'Tahsildar / Welfare Dept', defaultRefPrefix: 'RD' },
  { type: 'DOMICILE_CERTIFICATE', name: 'State Domicile Certificate', issuer: 'Tahsildar / Municipal Office', defaultRefPrefix: 'DOM' },
  { type: 'MARKS_CARD_12TH', name: 'Class 12 / PUC Marksheet', issuer: 'State Board / CBSE / CISCE', defaultRefPrefix: 'PUC' },
  { type: 'MARKS_CARD_10TH', name: 'Class 10 (SSLC) Marksheet', issuer: 'State Examination Board', defaultRefPrefix: 'SSLC' },
  { type: 'MARKS_CARD_PREVIOUS_SEM', name: 'Previous Semester Marksheet', issuer: 'University Examination Registrar', defaultRefPrefix: 'REG' },
  { type: 'BONAFIDE_CERTIFICATE', name: 'College Bonafide Study Certificate', issuer: 'Principal, Enrolled Institution', defaultRefPrefix: 'BON' },
  { type: 'BANK_PASSBOOK_SEEDED', name: 'Bank Passbook (Aadhaar DBT Seeded)', issuer: 'Nationalized Bank Branch', defaultRefPrefix: 'A/C' },
  { type: 'DISABILITY_CERTIFICATE', name: 'Medical Benchmark Disability Certificate', issuer: 'District Medical Board / UDID', defaultRefPrefix: 'UDID' },
];

export const PassportPage: React.FC = () => {
  const { profile, updateProfile, recalculateEligibility } = useProfile();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add / Edit
  const [docType, setDocType] = useState<DocumentType>('INCOME_CERTIFICATE');
  const [docName, setDocName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('2026-05-01');
  const [validityYear, setValidityYear] = useState('2026-27');
  const [availability, setAvailability] = useState<AvailabilityStatus>('AVAILABLE');
  const [notes, setNotes] = useState('');

  const documents = profile.documents || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddModal = (suggestedType?: DocumentType) => {
    const preset = SUGGESTED_DOCUMENTS.find((d) => d.type === (suggestedType || 'INCOME_CERTIFICATE'));
    setEditingDocId(null);
    setDocType(preset?.type || 'INCOME_CERTIFICATE');
    setDocName(preset?.name || 'Income Certificate');
    setIssuer(preset?.issuer || 'Revenue Dept');
    setReferenceNumber(`${preset?.defaultRefPrefix || 'DOC'}${Math.floor(10000000 + Math.random() * 90000000)}`);
    setIssueDate('2026-05-01');
    setValidityYear('2026-2031');
    setAvailability('AVAILABLE');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (doc: PassportDocument) => {
    setEditingDocId(doc.id);
    setDocType(doc.documentType);
    setDocName(doc.documentName);
    setIssuer(doc.issuer);
    setReferenceNumber(doc.referenceNumber);
    setIssueDate(doc.issueDate || '2026-05-01');
    setValidityYear(doc.validityYear || '2026-27');
    setAvailability(doc.availabilityStatus || (doc.verificationStatus === 'VERIFIED' ? 'AVAILABLE' : 'NEEDS_VERIFICATION'));
    setNotes(doc.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();

    const verificationStatus: VerificationStatus =
      availability === 'AVAILABLE' ? 'VERIFIED' :
      availability === 'NEEDS_VERIFICATION' ? 'NEEDS_VERIFICATION' :
      availability === 'EXPIRED' ? 'EXPIRED' :
      'MISSING';

    const docToSave: PassportDocument = {
      id: editingDocId || `doc-${docType.toLowerCase()}-${Date.now()}`,
      documentType: docType,
      documentName: docName.trim() || docType.replace(/_/g, ' '),
      issuer: issuer.trim() || 'Authorized Issuing Department',
      issueDate,
      validityYear,
      referenceNumber: referenceNumber.trim(),
      availabilityStatus: availability,
      verificationStatus,
      notes: notes.trim() || undefined,
      academicYear: profile.academicYear || '2026-27',
    };

    const updatedProfile = documentService.addOrUpdateDocument(profile, docToSave, profile.userId);
    updateProfile(updatedProfile);
    recalculateEligibility();

    setIsModalOpen(false);
    showToast(editingDocId ? 'Document metadata updated successfully!' : 'New certificate record registered in Passport!');
  };

  const handleDeleteDocument = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove metadata for "${name}"?`)) {
      const updatedProfile = documentService.removeDocument(profile, id, profile.userId);
      updateProfile(updatedProfile);
      recalculateEligibility();
      showToast('Document metadata record deleted.');
    }
  };

  const handleQuickStatusChange = (doc: PassportDocument, newStatus: AvailabilityStatus) => {
    const verifStatus: VerificationStatus =
      newStatus === 'AVAILABLE' ? 'VERIFIED' :
      newStatus === 'NEEDS_VERIFICATION' ? 'NEEDS_VERIFICATION' :
      newStatus === 'EXPIRED' ? 'EXPIRED' :
      'MISSING';

    const updatedDoc: PassportDocument = {
      ...doc,
      availabilityStatus: newStatus,
      verificationStatus: verifStatus,
    };

    const updatedProfile = documentService.addOrUpdateDocument(profile, updatedDoc, profile.userId);
    updateProfile(updatedProfile);
    recalculateEligibility();
    showToast(`Updated status for ${doc.documentName}`);
  };

  // Stats calculation
  const totalCount = documents.length;
  const availableCount = documents.filter((d) => d.availabilityStatus === 'AVAILABLE' || (!d.availabilityStatus && d.verificationStatus === 'VERIFIED')).length;
  const needsVerifCount = documents.filter((d) => d.availabilityStatus === 'NEEDS_VERIFICATION' || d.verificationStatus === 'NEEDS_VERIFICATION').length;
  const expiredCount = documents.filter((d) => d.availabilityStatus === 'EXPIRED' || d.verificationStatus === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate Passport"
        subtitle="Manage government certificate metadata once. Track validity years, RD numbers, and issuing authorities across all schemes."
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => openAddModal()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Certificate Record
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {toastMessage && (
        <div
          role="alert"
          className="p-3.5 bg-green-surface border border-green/30 text-green rounded-md text-xs font-semibold flex items-center justify-between shadow-subtle animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="hover:opacity-80 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Privacy Standard Banner */}
      <div className="p-3.5 bg-paper-surface border border-line rounded-lg text-xs text-muted flex items-start sm:items-center gap-2.5 shadow-subtle">
        <ShieldCheck className="w-4 h-4 text-green shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
        <span className="leading-relaxed">
          <strong className="text-ink">Zero Raw Files Guarantee:</strong> ScholarPath stores metadata only (RD reference numbers, issuing departments, issue dates). Physical and PDF certificate uploads are not stored in localStorage.
        </span>
      </div>

      {/* Passport Summary Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm" className="bg-paper-surface">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Total Certificates</span>
            <span className="text-xl font-bold text-ink">{totalCount}</span>
            <span className="text-[10px] text-muted">Registered in Passport</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-green-surface border-green/30">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-green font-semibold">Available</span>
            <span className="text-xl font-bold text-green">{availableCount}</span>
            <span className="text-[10px] text-green/80 font-medium">Ready for Scheme Use</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-gold-surface border-gold/40">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-ink font-semibold">Needs Verification</span>
            <span className="text-xl font-bold text-ink">{needsVerifCount}</span>
            <span className="text-[10px] text-muted">Pending Audit</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-paper-muted">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Expired / Missing</span>
            <span className="text-xl font-bold text-ink">{expiredCount}</span>
            <span className="text-[10px] text-muted">Requires Renewal</span>
          </div>
        </Card>
      </div>

      {/* Active Certificate Metadata Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink" />
            Registered Document Metadata ({documents.length})
          </h2>
          <span className="text-xs text-muted">AY 2026–27 Verification Cycle</span>
        </div>

        {documents.length === 0 ? (
          <Card className="text-center py-8">
            <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
            <h3 className="text-sm font-bold text-ink">No Certificate Metadata Recorded</h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
              Register your Revenue Department RD numbers and marksheets to unlock automatic eligibility validation.
            </p>
            <Button size="sm" variant="primary" onClick={() => openAddModal()}>
              Add First Certificate
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const currentAvail = doc.availabilityStatus || (doc.verificationStatus === 'VERIFIED' ? 'AVAILABLE' : 'NEEDS_VERIFICATION');
              return (
                <Card key={doc.id} className="flex flex-col justify-between">
                  <div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                            {doc.documentType.replace(/_/g, ' ')}
                          </span>
                          <CardTitle className="text-base">{doc.documentName}</CardTitle>
                          <CardDescription>Issuer: {doc.issuer}</CardDescription>
                        </div>
                        <StatusBadge
                          status={
                            currentAvail === 'AVAILABLE' ? 'READY' :
                            currentAvail === 'NEEDS_VERIFICATION' ? 'VERIFY' :
                            'MISSING'
                          }
                          size="sm"
                          customLabel={
                            currentAvail === 'AVAILABLE' ? 'Available (Self-Reported)' :
                            currentAvail === 'NEEDS_VERIFICATION' ? 'Needs Verification' :
                            currentAvail === 'EXPIRED' ? 'Expired' :
                            'Missing'
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2 pt-1">
                      <div className="flex justify-between items-center py-1 border-b border-line/60">
                        <span className="text-muted">Certificate / RD No:</span>
                        <span className="font-mono text-ink font-bold">{doc.referenceNumber || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-line/60">
                        <span className="text-muted">Issue Date:</span>
                        <span className="text-ink">{doc.issueDate || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-line/60">
                        <span className="text-muted">Validity Period:</span>
                        <span className="text-ink font-medium">{doc.validityYear || 'Current AY'}</span>
                      </div>
                      {doc.notes && (
                        <div className="pt-1 text-muted text-[11px]">
                          <span className="font-semibold text-ink">Notes: </span>{doc.notes}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  <CardFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-line/70 pt-3 mt-2">
                    {/* Status Toggles */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(doc, 'AVAILABLE')}
                        className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                          currentAvail === 'AVAILABLE'
                            ? 'bg-green text-paper border-green'
                            : 'bg-paper-surface text-muted border-line hover:text-ink'
                        }`}
                        title="Mark Available"
                      >
                        ✓ Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(doc, 'NEEDS_VERIFICATION')}
                        className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                          currentAvail === 'NEEDS_VERIFICATION'
                            ? 'bg-gold-surface text-ink border-gold'
                            : 'bg-paper-surface text-muted border-line hover:text-ink'
                        }`}
                        title="Mark Needs Verification"
                      >
                        ! Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(doc, 'EXPIRED')}
                        className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                          currentAvail === 'EXPIRED'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : 'bg-paper-surface text-muted border-line hover:text-ink'
                        }`}
                        title="Mark Expired"
                      >
                        Expired
                      </button>
                    </div>

                    {/* Edit and Delete Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 text-muted hover:text-ink rounded hover:bg-paper-muted transition-colors"
                        title="Edit metadata"
                        aria-label={`Edit ${doc.documentName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.documentName)}
                        className="p-1.5 text-muted hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Delete record"
                        aria-label={`Delete ${doc.documentName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Unregistered Documents Checklist */}
      <Card variant="muted" className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ink" />
            <CardTitle className="text-sm">Standard Welfare Documents Checklist</CardTitle>
          </div>
          <CardDescription>
            Documents commonly required by NSP, SSP Karnataka, and AICTE portals. Click to register metadata quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {SUGGESTED_DOCUMENTS.map((sug) => {
              const alreadyAdded = documents.some((d) => d.documentType === sug.type);
              return (
                <div
                  key={sug.type}
                  className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                    alreadyAdded
                      ? 'bg-green-surface/40 border-green/30 text-green'
                      : 'bg-paper-surface border-line text-ink hover:border-line-dark'
                  }`}
                >
                  <div className="space-y-0.5 truncate mr-2">
                    <p className="font-semibold truncate">{sug.name}</p>
                    <p className="text-[10px] text-muted truncate">{sug.issuer}</p>
                  </div>
                  {alreadyAdded ? (
                    <span className="text-[10px] font-bold text-green flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAddModal(sug.type)}
                      className="text-[11px] font-bold text-ink underline hover:text-gold-hover shrink-0"
                    >
                      + Register
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Metadata Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-paper-surface border border-line rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between bg-paper-muted">
              <h3 id="modal-title" className="text-sm font-bold text-ink flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-ink" />
                {editingDocId ? 'Edit Certificate Metadata' : 'Register Certificate Metadata'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-4 space-y-3.5 text-xs">
              <Select
                label="Document Classification Type"
                options={[
                  { value: 'INCOME_CERTIFICATE', label: 'Income Certificate (Revenue Dept)' },
                  { value: 'CASTE_CERTIFICATE', label: 'Caste / Category Certificate' },
                  { value: 'DOMICILE_CERTIFICATE', label: 'Domicile / Residency Certificate' },
                  { value: 'MARKS_CARD_12TH', label: 'Class 12 / PUC Marksheet' },
                  { value: 'MARKS_CARD_10TH', label: 'Class 10 (SSLC) Marksheet' },
                  { value: 'MARKS_CARD_PREVIOUS_SEM', label: 'Previous Semester Marksheet' },
                  { value: 'BONAFIDE_CERTIFICATE', label: 'College Bonafide Study Certificate' },
                  { value: 'BANK_PASSBOOK_SEEDED', label: 'Bank Passbook (Aadhaar Seeded)' },
                  { value: 'DISABILITY_CERTIFICATE', label: 'Disability Medical Certificate' },
                  { value: 'OTHER_CERTIFICATE', label: 'Other Scheme-Required Certificate' },
                ]}
                value={docType}
                onChange={(e) => {
                  const val = e.target.value as DocumentType;
                  setDocType(val);
                  const def = SUGGESTED_DOCUMENTS.find((d) => d.type === val);
                  if (def && !editingDocId) {
                    setDocName(def.name);
                    setIssuer(def.issuer);
                  }
                }}
                required
              />

              <Input
                label="Document Display Name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Income Certificate (Tahsildar)"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Issuing Authority"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Tahsildar, Revenue Dept"
                  required
                />

                <Input
                  label="Certificate / RD Reference Number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. RD0038472918"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />

                <Input
                  label="Validity Period / Expiry"
                  value={validityYear}
                  onChange={(e) => setValidityYear(e.target.value)}
                  placeholder="e.g. 2026-2031 (5 Years) or Permanent"
                  required
                />
              </div>

              <Select
                label="Document Availability Status"
                options={[
                  { value: 'AVAILABLE', label: 'Available (Student holds physical/e-copy)' },
                  { value: 'NEEDS_VERIFICATION', label: 'Needs Verification (Audit pending)' },
                  { value: 'EXPIRED', label: 'Expired (Needs Tahsildar renewal)' },
                  { value: 'MISSING', label: 'Missing (Must apply before deadline)' },
                ]}
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                required
              />

              <Input
                label="Additional Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Applied via Bangalore One center"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Metadata Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
