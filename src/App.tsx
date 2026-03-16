import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  signInWithRedirect,
  getRedirectResult,
  AuthError,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, Unsubscribe } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import NoteDetail from './components/NoteDetail';
import StudyPlanner from './components/StudyPlanner';
import { LayoutDashboard, Calendar, LogOut, Sparkles, Crown, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'note'>('dashboard');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const preferredAuthOrigin = import.meta.env.VITE_AUTH_ORIGIN;

  const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');
  const isVercelDomain = (hostname: string) => hostname.endsWith('.vercel.app');

  const getAuthErrorMessage = (error: unknown) => {
    const typedError = error as AuthError;
    const currentDomain = window.location.hostname;

    switch (typedError.code) {
      case 'auth/unauthorized-domain':
        return `Google sign-in is blocked because ${currentDomain} is not authorized in Firebase. Add this domain in Firebase Console > Authentication > Settings > Authorized domains.`;
      case 'auth/operation-not-supported-in-this-environment':
        return 'Google sign-in is blocked in this browser environment. Please open the app in a regular browser window and try again.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Google sign-in was cancelled. Please click Continue with Google again.';
      default:
        return 'Google sign-in failed. Please try again in a moment.';
    }
  };

  useEffect(() => {
    const loadRedirectResult = async () => {
      try {
        await getRedirectResult(auth);
        setAuthError(null);
      } catch (error) {
        setAuthError(getAuthErrorMessage(error));
        console.error('Redirect login failed', error);
      }
    };

    loadRedirectResult();

    let unsubscribeProfile: Unsubscribe | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            plan: 'free',
            pdfUploadsCount: 0,
            quizCount: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }

        unsubscribeProfile = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) setProfile(snapshot.data() as UserProfile);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'users')
        );
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleLogin = async () => {
    setAuthError(null);

    const currentHostname = window.location.hostname;
    const currentOrigin = normalizeOrigin(window.location.origin);

    if (preferredAuthOrigin) {
      try {
        const targetOrigin = normalizeOrigin(preferredAuthOrigin);
        const targetHostname = new URL(targetOrigin).hostname;

        if (isVercelDomain(currentHostname) && currentHostname !== targetHostname && currentOrigin !== targetOrigin) {
          const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          window.location.href = `${targetOrigin}${nextPath}`;
          return;
        }
      } catch {
        setAuthError('VITE_AUTH_ORIGIN is invalid. Set it to a full URL like https://your-production-domain.vercel.app.');
        return;
      }
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      return;
    } catch (error) {
      const typedError = error as AuthError;

      if (
        typedError.code === 'auth/popup-blocked' ||
        typedError.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      setAuthError(getAuthErrorMessage(error));
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
    return <Auth onLogin={handleLogin} errorMessage={authError} />;
  }

  const handleNavigate = (tab: 'dashboard' | 'planner' | 'note') => {
    setActiveTab(tab);
    if (tab !== 'note') setSelectedNoteId(null);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] lg:flex">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-gray-900">StudyFlow</h1>
        </div>
        <button onClick={() => setMobileNavOpen((v) => !v)} className="rounded-lg p-2 text-gray-700 hover:bg-gray-100">
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={cn(
          'border-r border-gray-200 bg-white lg:flex lg:w-64 lg:flex-col',
          mobileNavOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="hidden p-6 lg:flex lg:items-center lg:gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-gray-900">StudyFlow</h1>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 lg:py-0">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => handleNavigate('planner')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'planner' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Calendar className="w-4 h-4" />
            Study Planner
          </button>
        </nav>

        <div className="border-t border-gray-100 p-4">
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
                onClick={() => {
                  /* Handle Upgrade */
                }}
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

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              profile={profile}
              onViewNote={(id) => {
                setSelectedNoteId(id);
                setActiveTab('note');
                setMobileNavOpen(false);
              }}
            />
          )}
          {activeTab === 'planner' && <StudyPlanner profile={profile} />}
          {activeTab === 'note' && selectedNoteId && (
            <NoteDetail
              noteId={selectedNoteId}
              onBack={() => {
                setActiveTab('dashboard');
                setSelectedNoteId(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
