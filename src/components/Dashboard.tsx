import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, StudyNote } from '../types';
import { extractTextFromPdf } from '../services/pdf';
import { FileUp, FileText, Clock, Plus, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  profile: UserProfile | null;
  onViewNote: (id: string) => void;
}

export default function Dashboard({ profile, onViewNote }: DashboardProps) {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'studyNotes'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudyNote[];
      setNotes(notesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'studyNotes'));

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !auth.currentUser) return;

    // Check limits
    if (profile.plan === 'free' && profile.pdfUploadsCount >= 2) {
      alert("Free plan limit reached (2 PDFs/day). Upgrade to Pro for unlimited uploads!");
      return;
    }

    setUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      
      await addDoc(collection(db, 'studyNotes'), {
        uid: auth.currentUser.uid,
        title: file.name.replace('.pdf', ''),
        content: text,
        createdAt: serverTimestamp()
      });

      // Update user count
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        pdfUploadsCount: profile.pdfUploadsCount + 1
      });

    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to process PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Your Library</h2>
          <p className="text-gray-500 mt-1">Manage and study your uploaded notes.</p>
        </div>
        
        <label className={cn(
          "flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95",
          uploading && "opacity-50 cursor-not-allowed"
        )}>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {uploading ? "Processing..." : "Upload PDF"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Notes</p>
          <p className="text-3xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Uploads Today</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{profile?.pdfUploadsCount || 0}</p>
            <p className="text-sm text-gray-400 mb-1">/ {profile?.plan === 'pro' ? '∞' : '2'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Quizzes Taken</p>
          <p className="text-3xl font-bold text-gray-900">{profile?.quizCount || 0}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search notes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => onViewNote(note.id)}
              className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{note.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {note.createdAt?.toDate().toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-dashed border-gray-200 p-8 sm:p-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <FileUp className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-500 max-w-xs">Upload your first PDF study guide to get started with AI summaries and quizzes.</p>
        </div>
      )}
    </div>
  );
}
