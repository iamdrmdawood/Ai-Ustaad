import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Artifact,
  BookChunk,
  BookDocument,
  ChatMessage,
  ChatThread,
  Flashcard,
  QuizSession,
  StudentProgress,
  StudyNotes,
  StudySchedule,
  SupportedLanguage,
} from '../types';
import {
  INITIAL_BOOKS,
  INITIAL_STUDY_NOTES,
  INITIAL_SCHEDULE,
  UI_TRANSLATIONS,
} from '../data/defaultBooks';

interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  books: BookDocument[];
  activeBookId: string;
  setActiveBookId: (id: string) => void;
  activeBook?: BookDocument;
  allChunks: BookChunk[];
  addBook: (book: BookDocument) => void;
  deleteBook: (id: string) => void;
  addChunkToBook: (bookId: string, chunk: BookChunk) => void;

  studyNotes: StudyNotes[];
  activeNoteId: string;
  setActiveNoteId: (id: string) => void;
  activeNote?: StudyNotes;
  addStudyNotes: (note: StudyNotes) => void;
  updateFlashcardMastery: (
    noteId: string,
    flashcardId: string,
    level: Flashcard['masteryLevel']
  ) => void;

  quizzes: QuizSession[];
  activeQuiz: QuizSession | null;
  setActiveQuiz: (quiz: QuizSession | null) => void;
  saveQuizSession: (quiz: QuizSession) => void;
  recordQuizResult: (
    quizId: string,
    score: number,
    total: number,
    userAnswers: Record<string, string>,
    missedConcepts: string[]
  ) => void;

  schedule: StudySchedule;
  setSchedule: React.Dispatch<React.SetStateAction<StudySchedule>>;
  toggleScheduleTask: (dayNumber: number, sessionId: string) => void;

  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;

  // Claude & ChatGPT style threads & Artifacts
  threads: ChatThread[];
  activeThreadId: string;
  activeThread?: ChatThread;
  createNewThread: () => void;
  switchThread: (id: string) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  activeArtifact: Artifact | null;
  setActiveArtifact: (art: Artifact | null) => void;
  reasoningEnabled: boolean;
  setReasoningEnabled: (val: boolean) => void;

  progress: StudentProgress;
  incrementStudyMinutes: (mins: number) => void;
  resetAllData: () => void;
}

const defaultProgress: StudentProgress = {
  studyStreakDays: 5,
  totalStudyMinutes: 340,
  quizzesTaken: 8,
  averageQuizScore: 84.5,
  notesGeneratedCount: 3,
  vectorSearchesCount: 14,
  weakTopics: [
    { topic: 'AVL Tree Double Rotations', subject: 'Computer Science', errorCount: 2 },
    { topic: 'Substrate-Level Phosphorylation vs Oxidative', subject: 'Biology', errorCount: 1 },
  ],
  subjectMastery: {
    Biology: 88,
    'Computer Science': 79,
    Physics: 82,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('intellisnc_lang');
    return (saved as SupportedLanguage) || 'en';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [books, setBooks] = useState<BookDocument[]>(() => {
    const saved = localStorage.getItem('intellisnc_books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BOOKS;
      }
    }
    return INITIAL_BOOKS;
  });

  const [activeBookId, setActiveBookId] = useState<string>(() => {
    return books[0]?.id || 'book-bio-1';
  });

  const [studyNotes, setStudyNotes] = useState<StudyNotes[]>(() => {
    const saved = localStorage.getItem('intellisnc_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STUDY_NOTES;
      }
    }
    return INITIAL_STUDY_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return studyNotes[0]?.id || 'notes-bio-1';
  });

  const [quizzes, setQuizzes] = useState<QuizSession[]>(() => {
    const saved = localStorage.getItem('intellisnc_quizzes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);

  const [schedule, setSchedule] = useState<StudySchedule>(() => {
    const saved = localStorage.getItem('intellisnc_schedule');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SCHEDULE;
      }
    }
    return INITIAL_SCHEDULE;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('intellisnc_chat');
    if (saved) {
      try {
        const cleaned = saved.replace(/omnischolar/gi, 'Intellisnc').replace(/omni/gi, 'Intellisnc');
        return JSON.parse(cleaned);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        content:
          '👋 Hello! I am your **Intellisnc Ai**. I am directly connected to your uploaded books and vector database.\n\nAsk me any concept, request a step-by-step math derivation, or test your understanding with practice prompts in any language!',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('intellisnc_threads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'thread-default',
        title: 'Academic Q&A & Research',
        messages: [
          {
            id: 'msg-welcome',
            role: 'model',
            content:
              '👋 Hello! I am your **Intellisnc Ai**. I am directly connected to your uploaded books and vector database.\n\nAsk me any concept, request a step-by-step math derivation, or test your understanding with practice prompts in any language!',
            timestamp: new Date().toISOString(),
          },
        ],
        activeArtifact: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: 'gemini-3.8-flash',
        reasoningEnabled: true,
      },
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    return threads[0]?.id || 'thread-default';
  });

  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [reasoningEnabled, setReasoningEnabled] = useState<boolean>(true);

  const [progress, setProgress] = useState<StudentProgress>(() => {
    const saved = localStorage.getItem('intellisnc_progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultProgress;
      }
    }
    return defaultProgress;
  });

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('intellisnc_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('intellisnc_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('intellisnc_notes', JSON.stringify(studyNotes));
  }, [studyNotes]);

  useEffect(() => {
    localStorage.setItem('intellisnc_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('intellisnc_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('intellisnc_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('intellisnc_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('intellisnc_progress', JSON.stringify(progress));
  }, [progress]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const dict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    return dict[key] || UI_TRANSLATIONS.en[key] || key;
  };

  const activeBook = books.find((b) => b.id === activeBookId) || books[0];
  const activeNote = studyNotes.find((n) => n.id === activeNoteId) || studyNotes[0];

  const allChunks: BookChunk[] = books.flatMap((b) => b.chunks || []);

  const addBook = (newBook: BookDocument) => {
    setBooks((prev) => [newBook, ...prev]);
    setActiveBookId(newBook.id);
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (activeBookId === id && books.length > 1) {
      const next = books.find((b) => b.id !== id);
      if (next) setActiveBookId(next.id);
    }
  };

  const addChunkToBook = (bookId: string, chunk: BookChunk) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            chunks: [...(b.chunks || []), chunk],
          };
        }
        return b;
      })
    );
  };

  const addStudyNotes = (note: StudyNotes) => {
    setStudyNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)]);
    setActiveNoteId(note.id);
    setProgress((prev) => ({
      ...prev,
      notesGeneratedCount: prev.notesGeneratedCount + 1,
    }));
  };

  const updateFlashcardMastery = (
    noteId: string,
    flashcardId: string,
    level: Flashcard['masteryLevel']
  ) => {
    setStudyNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        return {
          ...note,
          flashcards: note.flashcards.map((fc) =>
            fc.id === flashcardId
              ? { ...fc, masteryLevel: level, lastReviewed: new Date().toISOString() }
              : fc
          ),
        };
      })
    );
  };

  const saveQuizSession = (quiz: QuizSession) => {
    setQuizzes((prev) => [quiz, ...prev.filter((q) => q.id !== quiz.id)]);
    setActiveQuiz(quiz);
  };

  const recordQuizResult = (
    quizId: string,
    score: number,
    total: number,
    userAnswers: Record<string, string>,
    missedConcepts: string[]
  ) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          return {
            ...q,
            score,
            totalQuestions: total,
            userAnswers,
            completedAt: new Date().toISOString(),
          };
        }
        return q;
      })
    );

    const percentage = total > 0 ? (score / total) * 100 : 0;

    setProgress((prev) => {
      const newTotalQuizzes = prev.quizzesTaken + 1;
      const newAverage =
        (prev.averageQuizScore * prev.quizzesTaken + percentage) / newTotalQuizzes;

      // Update weak topics
      const updatedWeak = [...prev.weakTopics];
      missedConcepts.forEach((concept) => {
        const existing = updatedWeak.find((w) => w.topic.toLowerCase() === concept.toLowerCase());
        if (existing) {
          existing.errorCount += 1;
        } else {
          updatedWeak.push({
            topic: concept,
            subject: 'Study Material',
            errorCount: 1,
          });
        }
      });

      return {
        ...prev,
        quizzesTaken: newTotalQuizzes,
        averageQuizScore: Number(newAverage.toFixed(1)),
        weakTopics: updatedWeak,
      };
    });
  };

  const toggleScheduleTask = (dayNumber: number, sessionId: string) => {
    setSchedule((prev) => {
      const newDays = prev.days.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        return {
          ...day,
          sessions: day.sessions.map((sess) => {
            if (sess.id === sessionId) {
              return { ...sess, completed: !sess.completed };
            }
            return sess;
          }),
        };
      });
      return { ...prev, days: newDays };
    });
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Study Conversation',
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          content:
            '👋 Hello! I am your **Intellisnc Ai**. What topic, book chapter, or academic problem would you like to explore today?',
          timestamp: new Date().toISOString(),
        },
      ],
      activeArtifact: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: 'gemini-3.8-flash',
      reasoningEnabled: true,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setChatMessages(newThread.messages);
    setActiveArtifact(null);
  };

  const switchThread = (id: string) => {
    const thread = threads.find((t) => t.id === id);
    if (thread) {
      setActiveThreadId(thread.id);
      setChatMessages(thread.messages);
      setActiveArtifact(thread.activeArtifact || null);
    }
  };

  const deleteThread = (id: string) => {
    if (threads.length <= 1) {
      createNewThread();
      return;
    }
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (activeThreadId === id) {
      setActiveThreadId(remaining[0].id);
      setChatMessages(remaining[0].messages);
      setActiveArtifact(remaining[0].activeArtifact || null);
    }
  };

  const renameThread = (id: string, title: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t))
    );
  };

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
    // Also update thread in threads list
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const updatedMessages = [...t.messages, msg];
          let updatedTitle = t.title;
          if (t.messages.length <= 1 && msg.role === 'user') {
            updatedTitle = msg.content.slice(0, 36) + (msg.content.length > 36 ? '...' : '');
          }
          return {
            ...t,
            title: updatedTitle,
            messages: updatedMessages,
            activeArtifact: msg.artifact || t.activeArtifact,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    if (msg.artifact) {
      setActiveArtifact(msg.artifact);
    }
  };

  const clearChatHistory = () => {
    const resetMsg: ChatMessage = {
      id: 'msg-welcome-new',
      role: 'model',
      content: 'Chat cleared. What concept from your books would you like to explore?',
      timestamp: new Date().toISOString(),
    };
    setChatMessages([resetMsg]);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [resetMsg], activeArtifact: null } : t))
    );
    setActiveArtifact(null);
  };

  const incrementStudyMinutes = (mins: number) => {
    setProgress((prev) => ({
      ...prev,
      totalStudyMinutes: prev.totalStudyMinutes + mins,
    }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setBooks(INITIAL_BOOKS);
    setStudyNotes(INITIAL_STUDY_NOTES);
    setSchedule(INITIAL_SCHEDULE);
    setProgress(defaultProgress);
    setQuizzes([]);
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,

        books,
        activeBookId,
        setActiveBookId,
        activeBook,
        allChunks,
        addBook,
        deleteBook,
        addChunkToBook,

        studyNotes,
        activeNoteId,
        setActiveNoteId,
        activeNote,
        addStudyNotes,
        updateFlashcardMastery,

        quizzes,
        activeQuiz,
        setActiveQuiz,
        saveQuizSession,
        recordQuizResult,

        schedule,
        setSchedule,
        toggleScheduleTask,

        chatMessages,
        addChatMessage,
        clearChatHistory,

        threads,
        activeThreadId,
        activeThread,
        createNewThread,
        switchThread,
        deleteThread,
        renameThread,
        activeArtifact,
        setActiveArtifact,
        reasoningEnabled,
        setReasoningEnabled,

        progress,
        incrementStudyMinutes,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
