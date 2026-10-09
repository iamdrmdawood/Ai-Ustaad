import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, Play, Cpu, Layers } from 'lucide-react';

interface PythonEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonEngineModal: React.FC<PythonEngineModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vector' | 'ocr' | 'scheduler' | 'interactive'>('vector');

  // Interactive NumPy simulator state
  const [queryInput, setQueryInput] = useState('mitochondrial ATP synthesis');
  const [simResults, setSimResults] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateNumpy = () => {
    setSimulating(true);
    setTimeout(() => {
      // Mock deterministic high-dimensional embedding simulation
      const docs = [
        {
          id: 'chunk_001',
          title: 'ATP Synthase & Chemiosmosis',
          page: 112,
          snippet: 'F0 rotor translocates H+ driving F1 catalytic conformational rotation...',
          vectorSim: 0.942,
        },
        {
          id: 'chunk_002',
          title: 'Glycolysis & PFK-1 Regulation',
          page: 115,
          snippet: '10-step catabolic pathway converting glucose to pyruvate with 2 net ATP...',
          vectorSim: 0.768,
        },
        {
          id: 'chunk_003',
          title: 'AVL Tree Double Rotations',
          page: 84,
          snippet: 'Strictly height-balanced BST invariant {-1, 0, 1} restored via rotations...',
          vectorSim: 0.182,
        },
      ];
      setSimResults(docs);
      setSimulating(false);
    }, 400);
  };

  const vectorDbPythonCode = `"""
OmniScholar Vector Engine: Semantic Search with sentence-transformers & NumPy
Requirements: pip install sentence-transformers numpy chromadb
"""
import numpy as np
from sentence_transformers import SentenceTransformer

class OmniVectorDatabase:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print(f"Loading embedding model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.embeddings = []

    def add_book_chunk(self, chunk_id: str, text: str, page: int, book: str):
        """Generates 384-d dense embedding and L2-normalizes it."""
        raw_vector = self.model.encode(text)
        # Unit normalization: ||v|| = 1 allows fast dot product == cosine similarity
        norm_vector = raw_vector / np.linalg.norm(raw_vector)
        
        self.documents.append({
            "id": chunk_id,
            "text": text,
            "page": page,
            "book": book
        })
        self.embeddings.append(norm_vector)

    def search(self, query: str, top_k: int = 3):
        """Semantic search via vectorized inner product."""
        q_raw = self.model.encode(query)
        q_norm = q_raw / np.linalg.norm(q_raw)
        
        # Matrix multiplication: (N, D) @ (D,) -> (N,)
        embedding_matrix = np.array(self.embeddings)
        cosine_scores = np.dot(embedding_matrix, q_norm)
        
        top_indices = np.argsort(cosine_scores)[::-1][:top_k]
        return [
            {
                "score": float(cosine_scores[i]),
                "doc": self.documents[i]
            }
            for i in top_indices
        ]`;

  const ocrPythonCode = `"""
OmniScholar OCR Engine: Computer Vision Textbook Preprocessing & OCR
Requirements: pip install pytesseract opencv-python pillow
"""
import cv2
import numpy as np
import pytesseract
from PIL import Image

def preprocess_book_page(image_path: str):
    """
    Applies adaptive thresholding, de-skewing, and noise filtering
    to enhance optical character recognition on scanned textbook pages.
    """
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Remove shadows and paper bleed-through
    dilated = cv2.dilate(gray, np.ones((7, 7), np.uint8))
    bg_img = cv2.medianBlur(dilated, 21)
    diff_img = 255 - cv2.absdiff(gray, bg_img)
    norm_img = cv2.normalize(diff_img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    
    # Otsu thresholding
    _, thresh = cv2.threshold(norm_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Academic page segmentation mode (PSM 6: Uniform text block)
    config = r'--oem 3 --psm 6'
    extracted_text = pytesseract.image_to_string(thresh, config=config)
    
    return {
        "text": extracted_text,
        "char_count": len(extracted_text),
        "word_count": len(extracted_text.split())
    }`;

  const schedulerPythonCode = `"""
OmniScholar Spaced Repetition Engine: SuperMemo SM-2 Interval Calculation
"""
def sm2_algorithm(repetition: int, ease_factor: float, quality: int):
    """
    repetition: Number of consecutive successful recalls (grade >= 3)
    ease_factor: Difficulty weight (default 2.5)
    quality: User score from 0 (blackout) to 5 (flawless recall)
    
    Returns: (next_interval_days, new_ease_factor, new_repetition)
    """
    if quality >= 3:
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

    # Update ease factor formula
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease_factor = max(1.3, ease_factor) # Lower bound

    return interval, round(ease_factor, 2), repetition`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Python AI & Vector DB Architecture</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Python 3.11+
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore the underlying mathematical pipelines for OCR, vector similarity, and spaced repetition.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('vector')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'vector'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Vector DB & Cosine (NumPy)
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'ocr'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            OCR Vision Pipeline (OpenCV)
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'scheduler'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Spaced Repetition (SM-2)
          </button>
          <button
            onClick={() => setActiveTab('interactive')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'interactive'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            Interactive Vector Test
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900/90 font-mono text-xs">
          {activeTab === 'vector' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-sans">
                  Vector Database Cosine Similarity Search (`numpy`, `sentence-transformers`)
                </span>
                <button
                  onClick={() => copyToClipboard(vectorDbPythonCode, 'vec')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-sans"
                >
                  {copiedKey === 'vec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'vec' ? 'Copied' : 'Copy Python Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
                <code>{vectorDbPythonCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-sans">
                  Adaptive Thresholding & Text Extraction (`pytesseract`, `cv2`)
                </span>
                <button
                  onClick={() => copyToClipboard(ocrPythonCode, 'ocr')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-sans"
                >
                  {copiedKey === 'ocr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ocr' ? 'Copied' : 'Copy Python Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
                <code>{ocrPythonCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'scheduler' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-sans">
                  SuperMemo SM-2 Interval Equation for Adaptive Study Schedules
                </span>
                <button
                  onClick={() => copyToClipboard(schedulerPythonCode, 'sm2')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-sans"
                >
                  {copiedKey === 'sm2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sm2' ? 'Copied' : 'Copy Python Script'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed">
                <code>{schedulerPythonCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="space-y-5 font-sans">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Test Python Vector Search Simulation
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Enter query to vectorize..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSimulateNumpy}
                    disabled={simulating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{simulating ? 'Computing dot product...' : 'Run np.dot()'}</span>
                  </button>
                </div>
              </div>

              {simResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Ranked Output (NumPy Vector Cosine Similarity):</span>
                    <span className="text-[11px] text-emerald-400 font-mono">Elapsed: 0.003s</span>
                  </div>
                  <div className="space-y-2">
                    {simResults.map((r, i) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">#{i + 1} {r.title}</span>
                            <span className="text-[10px] text-slate-400">Page {r.page}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{r.snippet}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {(r.vectorSim * 100).toFixed(1)}%
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            cos_sim = {r.vectorSim}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
