import React, { useState } from 'react';
import { generateStudyPlan } from '../services/gemini';
import { UserProfile } from '../types';
import { Calendar, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface StudyPlannerProps {
  profile: UserProfile | null;
}

export default function StudyPlanner({ profile }: StudyPlannerProps) {
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic || !profile) return;
    
    // Check limits for free plan
    if (profile.plan === 'free') {
      alert("Study Planner is a Pro feature. Upgrade to unlock!");
      return;
    }

    setLoading(true);
    try {
      const result = await generateStudyPlan(topic, days);
      setPlan(result);
    } catch (error) {
      console.error('Plan generation failed', error);
      alert('Failed to generate study plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">AI Study Planner</h2>
        <p className="text-gray-500 mt-1">Generate a personalized roadmap for any subject.</p>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject or Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Quantum Physics, Organic Chemistry..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration (Days)</label>
            <select 
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value={3}>3 Days (Crash Course)</option>
              <option value={7}>7 Days (Standard)</option>
              <option value={14}>14 Days (Deep Dive)</option>
              <option value={30}>30 Days (Mastery)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!topic || loading}
          className={cn(
            "w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100",
            loading && "animate-pulse"
          )}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? "Crafting your plan..." : "Generate Study Plan"}
        </button>
      </div>

      {plan ? (
        <div className="bg-white p-4 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm prose prose-indigo max-w-none">
          <ReactMarkdown>{plan}</ReactMarkdown>
        </div>
      ) : (
        <div className="bg-indigo-50/50 rounded-[24px] sm:rounded-[32px] border border-dashed border-indigo-100 p-8 sm:p-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Calendar className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to plan?</h3>
          <p className="text-gray-500 max-w-xs">Enter a topic above to get a customized AI study roadmap.</p>
        </div>
      )}
    </div>
  );
}
