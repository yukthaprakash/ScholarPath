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
  | 'BANK_PASSBOOK_SEEDED';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_VERIFICATION'
  | 'EXPIRED'
  | 'MISSING';

export interface PassportDocument {
  id: string;
  documentType: DocumentType;
  documentName: string;
  issuer: string;
  issueDate: string;
  validityYear: string;
  referenceNumber: string; // e.g. RD Number on Govt Income/Caste Certificate
  verificationStatus: VerificationStatus;
  notes?: string;
  academicYear: string;
}
