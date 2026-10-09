import { StudentProfile } from '../types/profile';

export const DEFAULT_DEMO_PROFILE: StudentProfile = {
  id: 'demo-student-vraj',
  userId: 'user-vraj-001',
  fullName: 'Vraj Ardeshana',
  dob: '2005-06-15',
  dateOfBirth: '2005-06-15',
  gender: 'MALE',
  email: 'vraj.student@example.edu.in',
  phoneNumber: '+91 98765 43210',

  // Domicile & Location
  domicileState: 'Karnataka',
  currentState: 'Karnataka',
  currentDistrict: 'Bengaluru Urban',
  urbanRural: 'URBAN',

  // Category & Social Status
  socialCategory: 'OBC',
  subCategory: 'Category 2A',
  casteCertificateAvailable: true,
  isMinority: false,
  isPersonWithDisability: false,
  disabilityCertificateAvailable: false,

  // Academic Details
  educationLevel: 'UNDERGRADUATE',
  courseName: 'Computer Science & Engineering',
  degreeName: 'B.E.',
  branch: 'Computer Science & Engineering',
  collegeId: 'rvce-bengaluru',
  collegeName: 'RV College of Engineering (RVCE)',
  university: 'Visvesvaraya Technological University (VTU)',
  collegeState: 'Karnataka',
  yearOfStudy: 2,
  admissionYear: 2024,
  academicYear: '2026-27',
  percentageOrCgpa: 88.0, // 88% / 8.8 CGPA
  previousAcademicPercentage: 86.5,
  isCgpa: false,
  previousYearPassed: true,
  institutionType: 'AIDED',

  // Financial Details
  annualFamilyIncome: 200000, // ₹2,00,000
  hasIncomeCertificate: true,
  incomeCertificateValidity: '2026-2031',
  incomeSource: 'Salaried / Private Service',
  familySize: 4,

  // Special Conditions
  isSingleParentChild: false,
  isOrphan: false,
  isFirstGenerationLearner: true,
  isDefenceBackground: false,
  isGirlChildOnly: false,
  isHosteller: false,

  // Document Passport Metadata (Metadata Only)
  documents: [
    {
      id: 'doc-inc-01',
      documentType: 'INCOME_CERTIFICATE',
      documentName: 'Income Certificate (RD Dept)',
      issuer: 'Tahsildar, Revenue Dept, Govt of Karnataka',
      issueDate: '2026-05-10',
      validityYear: '2026-2031',
      referenceNumber: 'RD0038472918',
      verificationStatus: 'VERIFIED',
      academicYear: '2026-27',
    },
    {
      id: 'doc-caste-01',
      documentType: 'CASTE_CERTIFICATE',
      documentName: 'Caste Certificate (Cat 2A)',
      issuer: 'Tahsildar, Revenue Dept, Govt of Karnataka',
      issueDate: '2025-04-12',
      validityYear: 'Permanent',
      referenceNumber: 'RD0029183741',
      verificationStatus: 'VERIFIED',
      academicYear: '2026-27',
    },
    {
      id: 'doc-marks-12th',
      documentType: 'MARKS_CARD_12TH',
      documentName: 'Class 12 Marks Card (88%)',
      issuer: 'Karnataka Pre-University Board (DPUE)',
      issueDate: '2024-05-20',
      validityYear: 'Permanent',
      referenceNumber: 'PUC20248819',
      verificationStatus: 'VERIFIED',
      academicYear: '2026-27',
    },
    {
      id: 'doc-bonafide-01',
      documentType: 'BONAFIDE_CERTIFICATE',
      documentName: 'College Bonafide Study Certificate',
      issuer: 'Principal, RVCE Bengaluru',
      issueDate: '2026-08-01',
      validityYear: '2026-27',
      referenceNumber: 'RVCE/BON/2026/0491',
      verificationStatus: 'NEEDS_VERIFICATION',
      academicYear: '2026-27',
    },
  ],
};

