import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set payload limit for book images and document scans
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Gemini client with aistudio-build user agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Lightweight fallback vectorizer in case of rate limits or offline state
function createFallbackEmbedding(text: string, dimensions = 256): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return vec;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
    // Bigram context
    if (i > 0) {
      const bigram = words[i - 1] + '_' + word;
      let biHash = 0;
      for (let c = 0; c < bigram.length; c++) {
        biHash = (biHash * 37 + bigram.charCodeAt(c)) & 0xffffffff;
      }
      vec[Math.abs(biHash) % dimensions] += 0.5;
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  }
  return vec;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Number((dot / denom).toFixed(4));
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. OCR Extraction Endpoint
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', bookTitle, targetLanguage = 'English' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required for OCR' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in environment (GEMINI_API_KEY).',
      });
    }

    const prompt = `You are an expert academic OCR and study document analysis engine.
Analyze this book/study material image with extreme optical character recognition accuracy.
Extract ALL readable content, maintaining headings, mathematical formulas (use clean LaTeX $...$ or standard text notation), bullet points, and tables.
Also extract metadata, key concepts, study takeaways, and section headers.

Target Output Language: ${targetLanguage}

Return your response in STRICT valid JSON format with this structure:
{
  "extractedText": "The full verbatim or high-precision transcribed text from the page...",
  "pageNumber": "Extracted or estimated page number (e.g., 'Page 42' or 'N/A')",
  "chapterTitle": "Chapter or section title detected on the page",
  "summary": "A clear 2-3 sentence executive study summary of this page",
  "keyConcepts": [
    { "term": "Term Name", "definition": "Clear concise explanation" }
  ],
  "formulasOrKeyPoints": [
    "Key formula, law, or vital takeaway statement"
  ],
  "suggestedTags": ["Biology", "ATP", "Mitochondria"]
}

Important: Return ONLY the JSON object. Do not wrap in markdown backticks if possible, or if wrapped in backticks ensure it can be parsed as JSON.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        parsedData = {
          extractedText: rawText,
          pageNumber: '1',
          chapterTitle: bookTitle || 'Document Page',
          summary: 'Scanned study page content',
          keyConcepts: [],
          formulasOrKeyPoints: [],
          suggestedTags: ['General Study'],
        };
      }
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('OCR Extraction error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to perform OCR extraction',
    });
  }
});

// 2. Vector Embedding Endpoint
app.post('/api/embeddings', async (req: Request, res: Response) => {
  try {
    const { texts } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' });
    }

    const embeddings: number[][] = [];

    if (ai) {
      try {
        // Try gemini-embedding-2-preview
        for (const text of texts) {
          const trimmed = text.slice(0, 1500);
          const result = await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: trimmed,
          });
          const values = (result as any).embeddings?.[0]?.values || (result as any).embedding?.values;
          if (values) {
            embeddings.push(values);
          } else {
            embeddings.push(createFallbackEmbedding(text));
          }
        }
        return res.json({ success: true, embeddings, method: 'gemini-embedding-2-preview' });
      } catch (err: any) {
        console.warn('Gemini embedding fallback triggered:', err.message);
        // Fallback to high-dimensional semantic vectorizer
        const fallbackEmbeddings = texts.map((t) => createFallbackEmbedding(t));
        return res.json({ success: true, embeddings: fallbackEmbeddings, method: 'semantic-hashing-v2' });
      }
    } else {
      const fallbackEmbeddings = texts.map((t) => createFallbackEmbedding(t));
      return res.json({ success: true, embeddings: fallbackEmbeddings, method: 'semantic-hashing-v2' });
    }
  } catch (error: any) {
    console.error('Embedding error:', error);
    return res.status(500).json({ error: error.message || 'Failed to compute embeddings' });
  }
});

// 3. Semantic Vector Search Endpoint
app.post('/api/semantic-search', async (req: Request, res: Response) => {
  try {
    const { query, chunks, topK = 4 } = req.body;
    if (!query || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'query string and chunks array are required' });
    }

    let queryVector: number[] = [];

    if (ai) {
      try {
        const result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: query.slice(0, 500),
        });
        const values = (result as any).embeddings?.[0]?.values || (result as any).embedding?.values;
        if (values) {
          queryVector = values;
        }
      } catch {
        queryVector = createFallbackEmbedding(query);
      }
    }
    if (queryVector.length === 0) {
      queryVector = createFallbackEmbedding(query);
    }

    // Rank chunks based on cosine similarity
    const scored = chunks.map((chunk) => {
      let chunkVector = chunk.vector;
      if (!chunkVector || chunkVector.length !== queryVector.length) {
        chunkVector = createFallbackEmbedding(chunk.text || '');
        if (queryVector.length !== chunkVector.length) {
          queryVector = createFallbackEmbedding(query);
        }
      }
      const score = cosineSimilarity(queryVector, chunkVector);
      return {
        ...chunk,
        similarityScore: score,
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    const topResults = scored.slice(0, topK);

    return res.json({
      success: true,
      query,
      results: topResults,
      totalIndexedChunks: chunks.length,
    });
  } catch (error: any) {
    console.error('Semantic search error:', error);
    return res.status(500).json({ error: error.message || 'Semantic search failed' });
  }
});

// 4. Smart Notes Generation Endpoint
app.post('/api/generate-notes', async (req: Request, res: Response) => {
  try {
    const { text, title, language = 'English', style = 'structured' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required to generate notes' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const prompt = `You are a world-class academic study notes designer.
Analyze the provided source text from book material and create comprehensive, beautiful student study notes.

Style requested: ${style} (e.g. Cornell Notes style, Concept Maps, Bullet Insights).
Target Output Language: ${language}

Source Text:
"""${text.slice(0, 8000)}"""

Return your response in STRICT valid JSON format matching:
{
  "title": "${title || 'Comprehensive Study Notes'}",
  "language": "${language}",
  "overview": "Clear 2-paragraph overview explaining what this topic is and why it matters in exams.",
  "cornellNotes": {
    "cuesAndQuestions": ["Key recall question 1", "Cue/trigger term 2", "Exam problem prompt 3"],
    "detailedNotes": [
      {
        "heading": "Section Heading",
        "points": ["Deep insight bullet 1", "Detailed conceptual explanation 2"]
      }
    ],
    "summary": "Cornell bottom synthesis summary paragraph."
  },
  "keyFormulasOrLaws": [
    { "name": "Law/Equation Name", "formula": "LaTeX or syntax formula", "explanation": "When to apply it" }
  ],
  "flashcards": [
    { "front": "Question / Concept Prompt", "back": "Precise answer / definition" }
  ],
  "mnemonics": [
    { "topic": "Concept", "trick": "Memory mnemonic phrase or acronym to memorize effortlessly" }
  ],
  "commonExamPitfalls": [
    "Common student mistake or misconception on this topic"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { overview: raw };
    }

    return res.json({ success: true, notes: data });
  } catch (error: any) {
    console.error('Notes generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate study notes' });
  }
});

// 5. Automated Quiz Generation Endpoint
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const {
      sourceText,
      subject = 'General STEM',
      difficulty = 'Medium',
      questionCount = 5,
      language = 'English',
    } = req.body;

    if (!sourceText) {
      return res.status(400).json({ error: 'sourceText is required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const prompt = `You are an elite academic examiner and educational psychometrician.
Generate a high-yield adaptive quiz based EXCLUSIVELY on the provided textbook / study material.

Subject: ${subject}
Difficulty Level: ${difficulty} (Easy, Medium, Hard, or Olympiad/Exam level)
Question Count: ${questionCount}
Language: ${language}

Source Material:
"""${sourceText.slice(0, 8000)}"""

Requirements:
- Create varied questions: Multiple Choice Questions (with 4 options), True/False questions, and Critical Application questions.
- Every question MUST have an in-depth pedagogical explanation explaining why the correct choice is right and why distractors are wrong.
- Provide source citation or concept tag for each question.

Return STRICT valid JSON format matching:
{
  "quizTitle": "Mastery Assessment: ${subject}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Clear question text?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Detailed explanation of the correct logic...",
      "conceptTested": "Concept or formula tested",
      "difficulty": "${difficulty}"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { questions: [] };
    }

    return res.json({ success: true, quiz: data });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// 6. Real-time Clarification & AI Tutor Chat (Claude / ChatGPT style with Canvas & Artifacts)
app.post('/api/chat-clarify', async (req: Request, res: Response) => {
  try {
    const {
      messages,
      contextDocuments = [],
      language = 'English',
      studentLevel = 'University / High School',
      reasoningEnabled = true,
      imageAttachment,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const contextSnippets = contextDocuments
      .map(
        (doc: any, i: number) =>
          `[Source ${i + 1}: ${doc.title || 'Book Page'} (Page ${doc.page || 'N/A'})]\n${doc.text || ''}`
      )
      .join('\n\n');

    const systemInstruction = `You are "Intellisnc Ai", a state-of-the-art AI academic engine combining the conversational mastery of Claude and ChatGPT with deep academic rigor and textbook vector search.

Student Parameters:
- Language: ${language} (Always respond in ${language} unless explicitly requested otherwise)
- Academic Level: ${studentLevel}

Core Capabilities & Guidelines:
1. Grounding: Ground answers in the provided book chunks when available, citing pages (e.g., "[Page 42]").
2. Reasoning & Thinking:
   ${reasoningEnabled ? 'Always start your response with a concise <thinking>...</thinking> section where you break down the question, outline the mathematical or conceptual steps, and verify key formulas before explaining.' : ''}
3. Artifacts & Canvas:
   When creating comprehensive study notes, runnable code (Python/JS/HTML), interactive quizzes, or cheat-sheets, encapsulate that content in a self-contained <artifact type="document|code|quiz|flashcards" title="Descriptive Title">...</artifact> tag!
   - type="document": for structured study notes, Cornell summaries, or essays.
   - type="code": for runnable Python, NumPy, algorithms, or formulas.
   - type="quiz": for practice questions with options and explanations.
   - type="flashcards": for concept:definition recall pairs.
   Keep conversational greetings and explanations outside the artifact.
4. Rich Formatting: Use LaTeX ($E=mc^2$ or $$\\int_a^b f(x)dx$$) for mathematics and physics equations. Bold keywords and use clean Markdown.
5. Tone: Warm, intellectually stimulating, encouraging, clear, and pedagogically brilliant.

Retrieved Context from Student's Books:
${contextSnippets ? contextSnippets : 'No specific book page pinned; answer with universal academic rigor.'}`;

    // Format chat history with optional multimodal image support
    const geminiContents = messages.map((m: any, idx: number) => {
      const parts: any[] = [{ text: m.content }];
      // If last user message contains an image attachment
      if (idx === messages.length - 1 && m.role === 'user' && (m.imageAttachment || imageAttachment)) {
        const rawImg = m.imageAttachment || imageAttachment;
        const cleanBase64 = rawImg.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        parts.unshift({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts,
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: geminiContents,
      config: {
        systemInstruction,
      },
    });

    const rawReply = response.text || 'I am ready to clarify any concept from your books!';

    // Extract <thinking> trace if present
    let thoughtProcess: string | undefined;
    let cleanReply = rawReply;
    const thinkingMatch = rawReply.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      thoughtProcess = thinkingMatch[1].trim();
      cleanReply = cleanReply.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    }

    // Extract <artifact> if present
    let artifact: any | undefined;
    const artifactMatch = cleanReply.match(/<artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/artifact>/i);
    if (artifactMatch) {
      artifact = {
        id: `art-${Date.now()}`,
        type: artifactMatch[1],
        title: artifactMatch[2],
        content: artifactMatch[3].trim(),
        createdAt: new Date().toISOString(),
      };
      cleanReply = cleanReply.replace(/<artifact[\s\S]*?<\/artifact>/i, '').trim();
      if (!cleanReply) {
        cleanReply = `I've created the **${artifact.title}** artifact for you in the Canvas panel!`;
      }
    }

    return res.json({
      success: true,
      reply: cleanReply,
      thoughtProcess,
      artifact,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat tutor error' });
  }
});

// 7. Personalized Study Schedule Generator
app.post('/api/study-schedule', async (req: Request, res: Response) => {
  try {
    const {
      examDate,
      dailyHours = 2.5,
      subjects = [],
      weakTopics = [],
      language = 'English',
    } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const prompt = `You are an expert cognitive learning specialist and study schedule architect.
Design a highly personalized, scientifically optimized study schedule using Spaced Repetition (Ebbinghaus Forgetting Curve) and Active Recall intervals.

Student Parameters:
- Target Exam Date: ${examDate || 'in 14 days'}
- Available Daily Study Time: ${dailyHours} hours/day
- Subjects / Books: ${JSON.stringify(subjects)}
- Identified Weak Areas / Difficult Topics: ${JSON.stringify(weakTopics)}
- Language: ${language}

Generate a structured 7-day adaptive plan with morning/afternoon blocks, active recall slots, quiz checkpoints, and rest intervals.

Return STRICT valid JSON format:
{
  "scheduleTitle": "Personalized High-Yield Study Blueprint",
  "weeklyTargetHours": ${dailyHours * 7},
  "strategyOverview": "Why this spaced schedule optimizes memory retention for your target exam...",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "focusSubject": "Subject Name",
      "theme": "Core Theory & Formula Mapping",
      "allocatedMinutes": ${Math.round(dailyHours * 60)},
      "sessions": [
        {
          "timeSlot": "09:00 - 10:30",
          "activity": "Deep Reading & OCR Note Review",
          "topic": "Topic Name",
          "technique": "Active Recall / Feynman Technique",
          "completed": false
        },
        {
          "timeSlot": "16:00 - 17:00",
          "activity": "Adaptive Vector Quiz & Spaced Review",
          "topic": "Weak Spot Remediation",
          "technique": "Flashcard testing",
          "completed": false
        }
      ],
      "dailyGoal": "Master 3 foundational theorems and score 80%+ on quiz."
    }
  ],
  "spacedRepetitionMilestones": [
    { "interval": "Day 1", "action": "First absorption & OCR note synthesis" },
    { "interval": "Day 3", "action": "First retrieval practice quiz" },
    { "interval": "Day 7", "action": "Interleaved problem set across subjects" },
    { "interval": "Day 14", "action": "Full simulated exam under time constraints" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : { days: [] };
    }

    return res.json({ success: true, schedule: data });
  } catch (error: any) {
    console.error('Schedule error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate schedule' });
  }
});

// 8. Translation Helper for Multilingual Education
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'text and targetLanguage are required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const prompt = `Translate the following academic study content accurately into ${targetLanguage}.
Keep technical terms, mathematical formulas, and formatting intact.

Text:
"""${text}"""

Return ONLY the translated text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ success: true, translatedText: response.text?.trim() });
  } catch (error: any) {
    console.error('Translate error:', error);
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// 9. Python Study Engine Snippet API (For students exploring the underlying Python code)
app.get('/api/python-snippets', (_req: Request, res: Response) => {
  res.json({
    ocrSnippet: `# Python OCR & Text Extraction Pipeline
import pytesseract
from PIL import Image
import cv2
import numpy as np

def extract_book_page(image_path: str) -> dict:
    """Preprocesses textbook page and extracts text with OCR."""
    img = cv2.imread(image_path)
    # Convert to grayscale and apply adaptive binarization
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    # OCR extraction
    custom_config = r'--oem 3 --psm 6'
    extracted_text = pytesseract.image_to_string(thresh, config=custom_config)
    return {
        "text": extracted_text,
        "word_count": len(extracted_text.split())
    }`,
    vectorDbSnippet: `# Python Vector Database & Cosine Semantic Search
import numpy as np
from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

class TextbookVectorDB:
    def __init__(self):
        self.chunks = []
        self.embeddings = []

    def insert_chunk(self, chunk_id: str, text: str, page: int):
        emb = model.encode(text)
        # L2 unit normalization for fast inner product
        emb_norm = emb / np.linalg.norm(emb)
        self.chunks.append({"id": chunk_id, "text": text, "page": page})
        self.embeddings.append(emb_norm)

    def query(self, query_str: str, top_k: int = 3):
        q_emb = model.encode(query_str)
        q_norm = q_emb / np.linalg.norm(q_emb)
        
        # Vectorized dot product cosine similarity
        matrix = np.array(self.embeddings)
        scores = np.dot(matrix, q_norm)
        
        top_indices = np.argsort(scores)[::-1][:top_k]
        results = [
            {"chunk": self.chunks[i], "score": float(scores[i])}
            for i in top_indices
        ]
        return results`,
    schedulerSnippet: `# Python Spaced Repetition Scheduling Engine (SuperMemo SM-2)
def calculate_next_review(repetition: int, ease_factor: float, grade: int):
    """
    grade: 0-5 (0=blackout, 5=perfect recall)
    returns: (next_interval_days, new_ease_factor, new_repetition)
    """
    if grade >= 3:
        if repetition == 0:
            interval = 1
        elif repetition == 1:
            interval = 6
        else:
            interval = int(round(interval * ease_factor))
        repetition += 1
    else:
        repetition = 0
        interval = 1
        
    ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    ease_factor = max(1.3, ease_factor)
    return interval, ease_factor, repetition`,
  });
});

// -------------------------------------------------------------
// Vite Dev & Production Static Middleware
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 intellisnc - Ai Ustaad Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
