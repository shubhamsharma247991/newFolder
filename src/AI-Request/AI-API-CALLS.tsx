// src/AI-Requests/AI-API-CALLS.tsx

import { toast } from 'sonner';
import { sendMessage } from '@/scripts/index';

export interface AIResponse {
  rating: number;
  feedback: string;
  follow_up_question?: string;
  follow_up_question_ans?: string;
}

/** internal holder for your component’s is-generating setter */
let setIsAiGeneratingGlobal: (isGenerating: boolean) => void = () => {};

/**
 * Wire your component’s setter into this module.
 * Call once from the component that uses generateResult:
 *
 *   import { initialize } from '@/AI-Requests/AI-API-CALLS';
 *   useEffect(() => { initialize(setIsAiGenerating); }, []);
 */
export const initialize = (
  setIsAiGenerating: (isGenerating: boolean) => void
) => {
  setIsAiGeneratingGlobal = setIsAiGenerating;
};

/** extract the first “{ … }” JSON block from a string */
function extractJsonObject(text: string): string | null {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

/**
 * Strip code-fences, pull out the JSON block, parse it.
 * Returns null on any failure.
 */
function tryParseAIResponse(raw: string): AIResponse | null {
  const stripped = raw.replace(/```/g, '').trim();
  const jsonText = extractJsonObject(stripped);
  if (!jsonText) {
    console.error('No JSON found in AI response:', raw);
    return null;
  }
  try {
    return JSON.parse(jsonText) as AIResponse;
  } catch (err) {
    console.error('Failed to JSON.parse:', jsonText, err);
    return null;
  }
}

/**
 * Ask the AI to rate & give feedback & propose a follow-up.
 */
export const generateResult = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<AIResponse | null> => {
  setIsAiGeneratingGlobal(true);
  try {
    const prompt = `
Question: "${question}"
User Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"

Tasks:
1. Rate the user answer on a scale of 1–10.
2. Provide constructive feedback.
3. (Optionally) Generate a follow-up question and its answer.

Return ONLY a JSON object with keys:
- rating (number)
- feedback (string)
- follow_up_question (string, optional)
- follow_up_question_ans (string, optional)
`;
    const text = await sendMessage(prompt);
    const parsed = tryParseAIResponse(text);
    if (!parsed) toast.error('AI returned invalid JSON; please try again.');
    return parsed;
  } catch (err: any) {
    console.error('generateResult error:', err);
    toast.error('AI request failed: ' + err.message);
    return null;
  } finally {
    setIsAiGeneratingGlobal(false);
  }
};

/**
 * Same pattern, for evaluating a follow-up answer.
 */
export const generateResultForFollowUpAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<AIResponse | null> => {
  setIsAiGeneratingGlobal(true);
  try {
    const prompt = `
      Question: "${question}"
      User Answer: "${userAnswer}"
      Correct Answer: "${correctAnswer}"

      Tasks:
      1. Rate 1–10.
      2. Give feedback.

      Return ONLY a JSON object with rating, feedback.`;
      
    const text = await sendMessage(prompt);
    const parsed = tryParseAIResponse(text);
    if (!parsed) toast.error('AI follow-up returned invalid JSON; please try again.');
    return parsed;
  } catch (err: any) {
    console.error('generateResultForFollowUpAnswer error:', err);
    toast.error('AI request failed: ' + err.message);
    return null;
  } finally {
    setIsAiGeneratingGlobal(false);
  }
};
