export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  plan: 'free' | 'pro';
  pdfUploadsCount: number;
  quizCount: number;
  lastResetDate: string;
}

export interface StudyNote {
  id: string;
  uid: string;
  title: string;
  content: string;
  createdAt: any;
}

export interface Quiz {
  id: string;
  uid: string;
  noteId: string;
  content: string;
  createdAt: any;
}
