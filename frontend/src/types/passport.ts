export type DocumentType =
  | 'INCOME_CERTIFICATE'
  | 'CASTE_CERTIFICATE'
  | 'DOMICILE_CERTIFICATE'
  | 'MARKS_CARD_10TH'
  | 'MARKS_CARD_12TH'
  | 'MARKS_CARD_PREVIOUS_SEM'
  | 'AADHAAR_CARD'
  | 'BONAFIDE_CERTIFICATE'
  | 'DISABILITY_CERTIFICATE'
  | 'BANK_PASSBOOK_SEEDED'
  | 'OTHER_CERTIFICATE';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_VERIFICATION'
  | 'EXPIRED'
  | 'MISSING';

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'MISSING'
  | 'EXPIRED'
  | 'NEEDS_VERIFICATION';

export interface PassportDocument {
  id: string;
  documentType: DocumentType;
  documentName: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  validityYear: string;
  referenceNumber: string; // e.g. RD Number on Govt Income/Caste Certificate
  availabilityStatus?: AvailabilityStatus; // Student-reported availability
  verificationStatus: VerificationStatus; // Government/Authority audit status
  notes?: string;
  academicYear: string;
}
