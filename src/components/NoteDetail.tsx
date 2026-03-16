import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { StudyNote } from '../types';
import { summarizeNote, generateQuiz, generateFlashcards } from '../services/gemini';
import { ArrowLeft, BookOpen, Brain, ListChecks, Layers, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface NoteDetailProps {
  noteId: string;
  onBack: () => void;
}

export default function NoteDetail({ noteId, onBack }: NoteDetailProps) {
  const [note, setNote] = useState<StudyNote | null>(null);
  const [activeTool, setActiveTool] = useState<'summary' | 'quiz' | 'flashcards'>('summary');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'studyNotes', noteId), (snapshot) => {
      if (snapshot.exists()) {
        setNote({ id: snapshot.id, ...snapshot.data() } as StudyNote);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `studyNotes/${noteId}`));

    return () => unsubscribe();
  }, [noteId]);

  const handleGenerate = async (tool: 'summary' | 'quiz' | 'flashcards') => {
    if (!note) return;
    setLoading(true);
    setActiveTool(tool);
    try {
      let result = '';
      if (tool === 'summary') result = await summarizeNote(note.content);
      else if (tool === 'quiz') result = await generateQuiz(note.content);
      else if (tool === 'flashcards') result = await generateFlashcards(note.content);
      setContent(result);
    } catch (error) {
      console.error('AI generation failed', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate summary on first load
  useEffect(() => {
    if (note && !content && !loading) {
      handleGenerate('summary');
    }
  }, [note]);

  if (!note) return null;

  return (
    <div className="space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{note.title}</h2>
          <p className="text-gray-500 mt-1">Study session powered by Gemini AI</p>
        </div>
      </div>

      {/* Tools Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => handleGenerate('summary')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTool === 'summary' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Summary
        </button>
        <button
          onClick={() => handleGenerate('quiz')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTool === 'quiz' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <ListChecks className="w-4 h-4" />
          Quiz
        </button>
        <button
          onClick={() => handleGenerate('flashcards')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTool === 'flashcards' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Layers className="w-4 h-4" />
          Flashcards
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm min-h-[500px] relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-indigo-600 animate-pulse">Gemini is thinking...</p>
          </div>
        ) : null}

        <div className="p-10 prose prose-indigo max-w-none">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <Brain className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a tool to start studying</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
