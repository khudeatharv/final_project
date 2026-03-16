import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import NoteDetail from './components/NoteDetail';
import StudyPlanner from './components/StudyPlanner';
import { BookOpen, LayoutDashboard, Calendar, LogOut, Sparkles, Crown } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'note'>('dashboard');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            plan: 'free',
            pdfUploadsCount: 0,
            quizCount: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        } else {
          // Sync profile
          onSnapshot(userDocRef, (snapshot) => {
            setProfile(snapshot.data() as UserProfile);
          }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl rotate-12" />
          <p className="text-sm font-medium text-gray-500">Loading StudyFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-gray-900">StudyFlow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedNoteId(null); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('planner'); setSelectedNoteId(null); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'planner' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Calendar className="w-4 h-4" />
            Study Planner
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.displayName}</p>
                <p className="text-[10px] text-gray-500 truncate">{profile?.plan === 'pro' ? 'Pro Member' : 'Free Plan'}</p>
              </div>
            </div>
            {profile?.plan === 'free' && (
              <button 
                onClick={() => { /* Handle Upgrade */ }}
                className="w-full mt-2 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-700 transition-colors"
              >
                <Crown className="w-3 h-3" />
                UPGRADE TO PRO
              </button>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              profile={profile} 
              onViewNote={(id) => { setSelectedNoteId(id); setActiveTab('note'); }} 
            />
          )}
          {activeTab === 'planner' && <StudyPlanner profile={profile} />}
          {activeTab === 'note' && selectedNoteId && (
            <NoteDetail 
              noteId={selectedNoteId} 
              onBack={() => { setActiveTab('dashboard'); setSelectedNoteId(null); }} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
