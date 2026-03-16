interface AiResponse {
  text?: string;
  error?: string;
}

async function callAi(payload: Record<string, unknown>): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AiResponse;

  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return data.text || '';
}

export async function summarizeNote(text: string) {
  return callAi({ type: 'summary', text });
}

export async function generateQuiz(text: string) {
  return callAi({ type: 'quiz', text });
}

export async function generateFlashcards(text: string) {
  return callAi({ type: 'flashcards', text });
}

export async function generateStudyPlan(topic: string, days: number) {
  return callAi({ type: 'study-plan', topic, days });
}
