import { buildSystemPrompt, buildUserContext } from './promptBuilder.js';
import { checkAnswerGuard } from './answerGuard.js';
import { getDeterministicFallback } from './fallback.js';
import { SchemeMatch, StudentProfile } from '@scholarpath/engine';

export interface ExplainMatchOptions {
  apiKey?: string;
  language?: 'en' | 'kn' | 'hi';
  timeoutMs?: number;
}

export async function explainMatchWithAI(
  profile: Partial<StudentProfile>,
  match: SchemeMatch,
  options: ExplainMatchOptions = {}
): Promise<{ text: string; isFallback: boolean; reason?: string }> {
  const timeoutMs = options.timeoutMs || 8000;
  const language = options.language || 'en';
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      text: getDeterministicFallback(match),
      isFallback: true,
      reason: 'GEMINI_API_KEY not configured; safely using deterministic fallback.',
    };
  }

  const systemPrompt = buildSystemPrompt(language);
  const userContextJson = buildUserContext(profile, match);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n\nVERIFIED JSON CONTEXT:\n${userContextJson}\n\nPlease summarize the eligibility status concise and accurately.` }
              ]
            }
          ]
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        text: getDeterministicFallback(match),
        isFallback: true,
        reason: `Gemini API HTTP Error ${response.status}`,
      };
    }

    interface GeminiApiResponse {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    }

    const data = (await response.json()) as GeminiApiResponse;
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        text: getDeterministicFallback(match),
        isFallback: true,
        reason: 'Empty output from Gemini API.',
      };
    }

    // Run Safety & Grounding Answer Guard
    const guardCheck = checkAnswerGuard(generatedText, userContextJson);
    if (!guardCheck.isValid) {
      return {
        text: getDeterministicFallback(match),
        isFallback: true,
        reason: `Answer Guard Rejection: ${guardCheck.reason}`,
      };
    }

    return {
      text: generatedText.trim(),
      isFallback: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: getDeterministicFallback(match),
      isFallback: true,
      reason: isAbort ? 'AI request timed out after 8 seconds.' : msg,
    };
  }
}
