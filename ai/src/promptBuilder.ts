import { SchemeMatch, StudentProfile } from '../engine/src/types.js';

export function buildSystemPrompt(language: 'en' | 'kn' | 'hi' = 'en'): string {
  if (language === 'kn') {
    return `ನೀವು ಶಾಲರ್‌ಪಾತ್ AI ಸಹಾಯಕ. ಸರಬರಾಜು ಮಾಡಿದ JSON ಸಂದರ್ಭದಿಂದ ಮಾತ್ರ ಉತ್ತರಿಸಿ. ಉತ್ತರ ಸಂದರ್ಭದಲ್ಲಿ ಇಲ್ಲದಿದ್ದರೆ, "ಇದು ನಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಡೇಟಾದಲ್ಲಿಲ್ಲ" ಎಂದು ನೀಡಿ. ಯಾವುದೇ ಹೊಸ ಸಂಖ್ಯೆಗಳು, ಲಿಂಕ್‌ಗಳು, ದಿನಾಂಕಗಳು ಅಥವಾ ಅನುಮೋದನೆಯ ಭರವಸೆಗಳನ್ನು ಸೇರಿಸಬೇಡಿ.`;
  }
  if (language === 'hi') {
    return `आप ScholarPath AI सहायक हैं। केवल दिए गए JSON संदर्भ से उत्तर दें। यदि उत्तर संदर्भ में नहीं है, तो उत्तर दें: "यह हमारे सत्यापित डेटा में नहीं है।" कोई भी नया नंबर, लिंक, तिथियां या स्वीकृति के दावे न जोड़ें।`;
  }
  return `You are the ScholarPath AI Assistant. Answer strictly using only the supplied JSON context. If any requested information is not in the context, respond: "This isn't in our verified data." Do not invent numbers, dates, links, or criteria. Never guarantee approval or money sanction.`;
}

export function buildUserContext(profile: Partial<StudentProfile>, match: SchemeMatch): string {
  const verifiedContext = {
    schemeTitle: match.schemeTitle,
    schemeType: match.schemeType,
    matchState: match.state,
    financialBenefit: match.financialBenefit,
    deadline: match.deadline,
    officialUrl: match.officialUrl,
    ruleTrace: match.ruleTrace.map(t => ({
      label: t.ruleLabel,
      outcome: t.outcome,
      studentValue: t.studentValue,
      expectedValue: t.expectedValue,
      clauseRef: t.clauseRef,
    })),
    missingActionableRules: match.missingActionableRules.map(m => m.ruleLabel),
    trustBanner: match.trustScore.bannerMessage,
    studentAcademicYear: profile.academic?.currentYear,
    studentCourse: profile.academic?.courseName,
  };

  return JSON.stringify(verifiedContext, null, 2);
}
