import { GoogleGenAI } from '@google/genai';

type AiType = 'summary' | 'quiz' | 'flashcards' | 'study-plan';

function buildPrompt(type: AiType, text?: string, topic?: string, days?: number): string {
  if (type === 'summary') {
    return `Summarize these study notes concisely. Use markdown for formatting:\n\n${text ?? ''}`;
  }

  if (type === 'quiz') {
    return `Create 5 multiple choice questions from the following text.\nFormat the output as a clean markdown list with options A, B, C, D and indicate the correct answer at the end of each question.\n\nText:\n${text ?? ''}`;
  }

  if (type === 'flashcards') {
    return `Create 10 flashcards from the following text.\nFormat each flashcard as:\nQ: [Question]\nA: [Answer]\n---\n\nText:\n${text ?? ''}`;
  }

  return `Create a detailed ${days ?? 7}-day study plan for the topic: "${topic ?? ''}". Include daily goals, key concepts to cover, and recommended study techniques. Use markdown.`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini not configured' });
  }

  const { type, text, topic, days } = req.body as {
    type?: AiType;
    text?: string;
    topic?: string;
    days?: number;
  };

  const validTypes: AiType[] = ['summary', 'quiz', 'flashcards', 'study-plan'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid AI request type' });
  }

  if ((type === 'study-plan' && !topic) || (type !== 'study-plan' && !text)) {
    return res.status(400).json({ error: 'Missing required payload' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildPrompt(type, text, topic, days),
    });

    return res.status(200).json({ text: response.text ?? '' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI request failed';
    return res.status(500).json({ error: message });
  }
}
