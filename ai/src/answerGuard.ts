export function checkAnswerGuard(
  responseText: string,
  contextJsonString: string
): { isValid: boolean; reason?: string } {
  const textLower = responseText.toLowerCase();

  // 1. Approval Guarantee Check
  const prohibitedClaims = [
    'definitely get',
    'guaranteed',
    'guarantee',
    'sanction approved',
    'you are approved',
    'you will receive the money',
    '100% chance',
  ];

  for (const claim of prohibitedClaims) {
    if (textLower.includes(claim)) {
      return {
        isValid: false,
        reason: `Prohibited claim detected: '${claim}'. AI layer is strictly forbidden from claiming eligibility approval or payment guarantees.`,
      };
    }
  }

  // 2. Extracted URL & Domain Grounding Check
  const urlRegex = /(?:https?:\/\/|www\.)[^\s]+|\b[a-zA-Z0-9-]+\.(?:com|org|net|gov|edu|in|io)\b/gi;
  const urlsInResponse = responseText.match(urlRegex) || [];
  for (const url of urlsInResponse) {
    if (!contextJsonString.includes(url)) {
      return {
        isValid: false,
        reason: `Ungrounded URL / domain detected: '${url}' is not present in the verified context JSON.`,
      };
    }
  }

  // 3. Extracted Date Grounding Check (YYYY-MM-DD)
  const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;
  const datesInResponse = responseText.match(dateRegex) || [];
  for (const date of datesInResponse) {
    if (!contextJsonString.includes(date)) {
      return {
        isValid: false,
        reason: `Ungrounded Date detected: '${date}' is not present in the verified context JSON.`,
      };
    }
  }

  return { isValid: true };
}
