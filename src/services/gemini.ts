import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeNote(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize these study notes concisely. Use markdown for formatting:\n\n${text}`,
  });
  return response.text;
}

export async function generateQuiz(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create 5 multiple choice questions from the following text. 
    Format the output as a clean markdown list with options A, B, C, D and indicate the correct answer at the end of each question.
    
    Text:
    ${text}`,
  });
  return response.text;
}

export async function generateFlashcards(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create 10 flashcards from the following text. 
    Format each flashcard as:
    Q: [Question]
    A: [Answer]
    ---
    
    Text:
    ${text}`,
  });
  return response.text;
}

export async function generateStudyPlan(topic: string, days: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a detailed ${days}-day study plan for the topic: "${topic}". 
    Include daily goals, key concepts to cover, and recommended study techniques. Use markdown.`,
  });
  return response.text;
}
