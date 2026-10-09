import { Artifact, BookChunk, KeyConcept, QuizSession, StudyNotes, StudySchedule } from '../types';

export interface OcrResult {
  extractedText: string;
  pageNumber: string;
  chapterTitle: string;
  summary: string;
  keyConcepts: KeyConcept[];
  formulasOrKeyPoints: string[];
  suggestedTags: string[];
}

export interface SemanticSearchResult {
  query: string;
  results: Array<BookChunk & { similarityScore: number }>;
  totalIndexedChunks: number;
}

export interface TutorClarifyResponse {
  reply: string;
  thoughtProcess?: string;
  artifact?: Artifact;
}

export async function runOcrExtraction(
  imageBase64: string,
  bookTitle?: string,
  targetLanguage: string = 'English'
): Promise<OcrResult> {
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      bookTitle,
      targetLanguage,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'OCR Extraction failed');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch('/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to compute embeddings');
  }

  const json = await res.json();
  return json.embeddings;
}

export async function performSemanticSearch(
  query: string,
  chunks: BookChunk[],
  topK: number = 4
): Promise<SemanticSearchResult> {
  const res = await fetch('/api/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, chunks, topK }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Semantic search failed');
  }

  return await res.json();
}

export async function generateSmartNotes(
  text: string,
  title: string,
  language: string = 'English',
  style: string = 'Cornell Notes'
): Promise<Partial<StudyNotes>> {
  const res = await fetch('/api/generate-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title, language, style }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate study notes');
  }

  const json = await res.json();
  return json.notes;
}

export async function generateAdaptiveQuiz(
  sourceText: string,
  subject: string,
  difficulty: string,
  questionCount: number = 5,
  language: string = 'English'
): Promise<Partial<QuizSession>> {
  const res = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceText,
      subject,
      difficulty,
      questionCount,
      language,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate quiz');
  }

  const json = await res.json();
  return json.quiz;
}

export async function sendTutorClarification(
  messages: Array<{ role: 'user' | 'model'; content: string; imageAttachment?: string }>,
  contextDocuments: Array<{ title: string; page: number; text: string }>,
  language: string = 'English',
  studentLevel: string = 'University / College',
  reasoningEnabled: boolean = true,
  imageAttachment?: string
): Promise<TutorClarifyResponse> {
  const res = await fetch('/api/chat-clarify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      contextDocuments,
      language,
      studentLevel,
      reasoningEnabled,
      imageAttachment,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Chat tutor failed');
  }

  const json = await res.json();
  return {
    reply: json.reply || '',
    thoughtProcess: json.thoughtProcess,
    artifact: json.artifact,
  };
}

export async function generateStudySchedule(
  examDate: string,
  dailyHours: number,
  subjects: string[],
  weakTopics: string[],
  language: string = 'English'
): Promise<StudySchedule> {
  const res = await fetch('/api/study-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examDate,
      dailyHours,
      subjects,
      weakTopics,
      language,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate schedule');
  }

  const json = await res.json();
  return json.schedule;
}

export async function translateContent(text: string, targetLanguage: string): Promise<string> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Translation failed');
  }

  const json = await res.json();
  return json.translatedText;
}

export async function fetchPythonSnippets(): Promise<{
  ocrSnippet: string;
  vectorDbSnippet: string;
  schedulerSnippet: string;
}> {
  const res = await fetch('/api/python-snippets');
  if (!res.ok) {
    throw new Error('Failed to fetch python snippets');
  }
  return await res.json();
}
