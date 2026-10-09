export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'zh'
  | 'hi'
  | 'ar'
  | 'ja'
  | 'pt'
  | 'ko';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export interface BookChunk {
  id: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  chapterTitle: string;
  text: string;
  vector?: number[];
  similarityScore?: number;
  tags?: string[];
  createdAt: string;
}

export interface BookDocument {
  id: string;
  title: string;
  subject: string;
  author?: string;
  totalPages: number;
  coverImage?: string;
  chunks: BookChunk[];
  scannedAt: string;
  notesGenerated?: boolean;
}

export interface KeyConcept {
  term: string;
  definition: string;
}

export interface CornellSection {
  heading: string;
  points: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  masteryLevel: 'new' | 'learning' | 'mastered';
  lastReviewed?: string;
}

export interface StudyNotes {
  id: string;
  bookId: string;
  title: string;
  subject: string;
  language: string;
  overview: string;
  cornellNotes: {
    cuesAndQuestions: string[];
    detailedNotes: CornellSection[];
    summary: string;
  };
  keyFormulasOrLaws: Array<{
    name: string;
    formula: string;
    explanation: string;
  }>;
  flashcards: Flashcard[];
  mnemonics: Array<{
    topic: string;
    trick: string;
  }>;
  commonExamPitfalls: string[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'concept';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTested?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizSession {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  questions: QuizQuestion[];
  completedAt?: string;
  score?: number;
  totalQuestions?: number;
  userAnswers?: Record<string, string>;
}

export interface StudySessionItem {
  id: string;
  timeSlot: string;
  activity: string;
  topic: string;
  technique: string;
  completed: boolean;
  durationMinutes?: number;
}

export interface StudyDayPlan {
  dayNumber: number;
  dayName: string;
  focusSubject: string;
  theme: string;
  allocatedMinutes: number;
  sessions: StudySessionItem[];
  dailyGoal: string;
}

export interface StudySchedule {
  id: string;
  title: string;
  examDate: string;
  weeklyTargetHours: number;
  strategyOverview: string;
  days: StudyDayPlan[];
  spacedRepetitionMilestones: Array<{
    interval: string;
    action: string;
  }>;
  createdAt: string;
}

export interface Artifact {
  id: string;
  type: 'document' | 'code' | 'quiz' | 'flashcards' | 'markdown';
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  thoughtProcess?: string; // Extended thinking / reasoning trace
  artifact?: Artifact;
  imageAttachment?: string;
  citations?: Array<{
    title: string;
    page: number;
    snippet: string;
    similarityScore?: number;
  }>;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  activeArtifact?: Artifact | null;
  createdAt: string;
  updatedAt: string;
  model: string;
  reasoningEnabled?: boolean;
}

export interface StudentProgress {
  studyStreakDays: number;
  totalStudyMinutes: number;
  quizzesTaken: number;
  averageQuizScore: number;
  notesGeneratedCount: number;
  vectorSearchesCount: number;
  weakTopics: Array<{
    topic: string;
    subject: string;
    errorCount: number;
  }>;
  subjectMastery: Record<string, number>; // e.g. { "Biology": 82, "CS": 90 }
}
