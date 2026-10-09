import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { runOcrExtraction, generateSmartNotes, fetchEmbeddings, translateContent } from '../services/api';
import {
  ScanText,
  Upload,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Database,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';

// Pre-made textbook page samples with high-yield academic diagrams & text
const SAMPLE_PAGES = [
  {
    id: 'sample-bio',
    title: 'Cellular Biology - Chemiosmosis & ATP Synthase',
    subject: 'Biology',
    pageNumber: 'Page 112',
    color: 'from-emerald-950/80 to-slate-900',
    borderColor: 'border-emerald-500/40',
    description: 'Rotary motor F0/F1 mechanism, proton electrochemical gradient, ATP yield.',
    imageText: `CAMPBELL BIOLOGY • CHAPTER 5 • SECTION 3
THE ROTARY ENGINE: CHEMIOSMOSIS & ATP SYNTHASE
The synthesis of adenosine triphosphate (ATP) in eukaryotic mitochondria is catalyzed by ATP synthase, a multi-subunit protein complex spanning the inner mitochondrial membrane. 

1. Proton Motive Force (PMF):
High-energy electrons donated by NADH and FADH2 traverse Complex I, III, and IV of the Electron Transport Chain (ETC). Proton pumping into the intermembrane space establishes an electrical potential (ΔΨ ≈ 160 mV) and a pH differential (ΔpH ≈ 0.8 to 1.0).

2. Catalytic Mechanism of F0 and F1 Subunits:
- F0 Subunit: Hydrophobic rotor embedded in the membrane. Protons bind to glutamate or aspartate residues on the c-ring, causing rotation through a stator channel.
- F1 Subunit: Extends into the mitochondrial matrix. Composed of 3 alpha and 3 beta catalytic dimers. As the central gamma shaft rotates, each beta subunit cycles through three conformational states:
  • Open (O): Low affinity for nucleotides; newly formed ATP is released.
  • Loose (L): Traps ADP and inorganic phosphate (Pi) loosely.
  • Tight (T): Synthesizes ATP from ADP + Pi with high catalytic affinity.

3. Stoichiometry:
Under standard biochemical conditions:
ΔG°' for ATP synthesis ≈ +30.5 kJ/mol.
Approximately 3.33 protons must flow through F0 to generate 1 ATP molecule.`,
  },
  {
    id: 'sample-cs',
    title: 'Computer Science - AVL Trees & Balanced Rotations',
    subject: 'Computer Science',
    pageNumber: 'Page 84',
    color: 'from-sky-950/80 to-slate-900',
    borderColor: 'border-sky-500/40',
    description: 'Height invariant, balance factors, single vs double tree rotations, O(log N) proofs.',
    imageText: `INTRODUCTION TO ALGORITHMS • CHAPTER 4
SELF-BALANCING BINARY SEARCH TREES: THE AVL CRITERION
Invented in 1962 by Georgy Adelson-Velsky and Evgenii Landis, an AVL tree is a self-balancing binary search tree (BST) designed to eliminate worst-case O(N) degenerations into linked lists.

1. Balance Factor Invariant:
For every node v in an AVL tree, let:
BalanceFactor(v) = Height(v.left) - Height(v.right)
The AVL invariant mandates: BalanceFactor(v) ∈ {-1, 0, 1}.

2. Rebalancing via Rotations:
When an insertion increases the height of a subtree such that |BF(v)| = 2, exactly one of four rotation cases restores balance in O(1) time:
- Case 1: Left-Left (LL) Heavy -> Perform Single Right Rotation on v.
- Case 2: Right-Right (RR) Heavy -> Perform Single Left Rotation on v.
- Case 3: Left-Right (LR) Heavy -> Perform Left Rotation on v.left, then Right Rotation on v.
- Case 4: Right-Left (RL) Heavy -> Perform Right Rotation on v.right, then Left Rotation on v.

3. Complexity Analysis:
Worst-case maximum height for N nodes:
Height ≤ 1.44 * log2(N + 2) - 0.328
Guarantees Search, Insertion, and Deletion terminate in strictly O(log N) time.`,
  },
  {
    id: 'sample-phys',
    title: 'Physics - Angular Momentum & Rotational Dynamics',
    subject: 'Physics',
    pageNumber: 'Page 62',
    color: 'from-indigo-950/80 to-slate-900',
    borderColor: 'border-indigo-500/40',
    description: 'Torque, moment of inertia tensor, angular conservation laws in closed systems.',
    imageText: `UNIVERSITY PHYSICS • CHAPTER 3
ROTATIONAL DYNAMICS & CONSERVATION OF ANGULAR MOMENTUM
Rotational motion mirrors linear Newtonian kinematics through rotational analogues: moment of inertia I replaces mass m, and torque τ replaces force F.

1. Fundamental Equations:
Angular Momentum of a particle: L = r x p = I * ω
Net External Torque: τ_net = dL/dt = I * α

2. Law of Conservation of Angular Momentum:
If the net external torque acting on a closed system is zero (τ_ext = 0):
dL/dt = 0 => L_total = constant
Therefore:
I_initial * ω_initial = I_final * ω_final

3. Moment of Inertia (Parallel-Axis Theorem):
For a rigid body of total mass M with center-of-mass moment of inertia I_cm, the moment of inertia about any parallel axis separated by distance d is:
I_parallel = I_cm + M * d^2`,
  },
];

export const OcrBookScanner: React.FC = () => {
  const {
    t,
    language,
    books,
    activeBookId,
    addChunkToBook,
    addStudyNotes,
    setActiveTab,
    setActiveNoteId,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<typeof SAMPLE_PAGES[0] | null>(SAMPLE_PAGES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLaserActive, setScanLaserActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extracted result
  const [extractedData, setExtractedData] = useState<{
    text: string;
    pageNumber: string;
    chapterTitle: string;
    summary: string;
    keyConcepts: Array<{ term: string; definition: string }>;
    formulas: string[];
    tags: string[];
  } | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isSavingVector, setIsSavingVector] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSelectSample = (sample: typeof SAMPLE_PAGES[0]) => {
    setSelectedSample(sample);
    setSelectedImage(null);
    setExtractedData(null);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setSelectedSample(null);
        setExtractedData(null);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerOcrScan = async () => {
    setIsScanning(true);
    setScanLaserActive(true);
    setErrorMsg(null);
    setSuccessToast(null);

    try {
      if (selectedSample && !selectedImage) {
        // Fast mock-backed OCR pipeline for sample text
        await new Promise((resolve) => setTimeout(resolve, 900));
        setExtractedData({
          text: selectedSample.imageText,
          pageNumber: selectedSample.pageNumber,
          chapterTitle: selectedSample.title,
          summary: selectedSample.description,
          keyConcepts: [
            { term: 'Proton Motive Force (PMF)', definition: 'Electrochemical gradient of H+ powering ATP synthase.' },
            { term: 'F0 and F1 Subunits', definition: 'F0 rotor translocates protons; F1 catalytic head synthesizes ATP.' },
          ],
          formulas: ['\\Delta p = \\Delta \\Psi - (2.3 RT / F) \\Delta \\text{pH}', '3.33 \\text{ H}^+ \\rightarrow 1 \\text{ ATP}'],
          tags: [selectedSample.subject, 'Textbook Extract', 'Core Syllabus'],
        });
      } else if (selectedImage) {
        // Real multimodal Gemini OCR call
        const result = await runOcrExtraction(selectedImage, 'Uploaded Book Scan', language);
        setExtractedData({
          text: result.extractedText,
          pageNumber: result.pageNumber || 'Page 1',
          chapterTitle: result.chapterTitle || 'Scanned Chapter',
          summary: result.summary || 'Summary of scanned study material.',
          keyConcepts: result.keyConcepts || [],
          formulas: result.formulasOrKeyPoints || [],
          tags: result.suggestedTags || ['Study Notes'],
        });
      } else {
        setErrorMsg('Please select a sample or upload a book image first.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'OCR extraction failed. Please try again.');
    } finally {
      setIsScanning(false);
      setScanLaserActive(false);
    }
  };

  const handleSaveToVectorDb = async () => {
    if (!extractedData) return;
    setIsSavingVector(true);
    try {
      const targetBookId = activeBookId || books[0]?.id;
      const targetBook = books.find((b) => b.id === targetBookId) || books[0];

      // Compute vector embedding for this chunk
      let vector: number[] = [];
      try {
        const embs = await fetchEmbeddings([extractedData.text.slice(0, 1000)]);
        vector = embs[0] || [];
      } catch {
        // fallback computed on server
      }

      const newChunk = {
        id: `chunk-${Date.now()}`,
        bookId: targetBook.id,
        bookTitle: targetBook.title,
        pageNumber: parseInt(extractedData.pageNumber.replace(/[^0-9]/g, '')) || 1,
        chapterTitle: extractedData.chapterTitle,
        text: extractedData.text,
        vector,
        tags: extractedData.tags,
        createdAt: new Date().toISOString(),
      };

      addChunkToBook(targetBook.id, newChunk);
      setSuccessToast(`Chunk indexed into vector database for "${targetBook.title}"!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to index vector chunk');
    } finally {
      setIsSavingVector(false);
    }
  };

  const handleGenerateNotesFromScan = async () => {
    if (!extractedData) return;
    setIsGeneratingNotes(true);
    try {
      const generated = await generateSmartNotes(
        extractedData.text,
        extractedData.chapterTitle,
        language
      );

      const notesObj = {
        id: `notes-${Date.now()}`,
        bookId: activeBookId || books[0]?.id,
        title: generated.title || extractedData.chapterTitle,
        subject: extractedData.tags[0] || 'General Study',
        language,
        overview: generated.overview || extractedData.summary,
        cornellNotes: generated.cornellNotes || {
          cuesAndQuestions: ['What is the core takeaway?', 'How is this tested in exams?'],
          detailedNotes: [{ heading: 'Key Concept', points: [extractedData.summary] }],
          summary: extractedData.summary,
        },
        keyFormulasOrLaws: generated.keyFormulasOrLaws || [],
        flashcards: (generated.flashcards || []).map((fc, i) => ({
          ...fc,
          id: `fc-${Date.now()}-${i}`,
          masteryLevel: 'new' as const,
        })),
        mnemonics: generated.mnemonics || [],
        commonExamPitfalls: generated.commonExamPitfalls || [],
        createdAt: new Date().toISOString(),
      };

      addStudyNotes(notesObj);
      setActiveNoteId(notesObj.id);
      setActiveTab('notes');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate Cornell notes');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleTranslateScan = async (targetLang: string) => {
    if (!extractedData) return;
    setIsTranslating(true);
    try {
      const translated = await translateContent(extractedData.text, targetLang);
      setExtractedData({
        ...extractedData,
        text: translated,
      });
      setSuccessToast(`Text translated to ${targetLang}!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    if (extractedData?.text) {
      navigator.clipboard.writeText(extractedData.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">OCR Book Scanner & Extractor</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
              Vision AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture or upload textbook pages, handwritten lecture notes, and study sheets to convert them into structured notes & vector search chunks.
          </p>
        </div>

        {/* Upload Trigger */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Upload Photo/Scan</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sample Textbook Pickers */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Or Test with Pre-Loaded Academic Textbook Pages:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_PAGES.map((sample) => {
            const isSelected = selectedSample?.id === sample.id && !selectedImage;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                    {sample.pageNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{sample.subject}</span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {sample.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Visual Scanner & Extracted Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Visual Preview & OCR Action */}
        <div className="space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden min-h-[360px] flex flex-col justify-between p-5">
            {/* Laser scanning beam animation */}
            {scanLaserActive && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_#6366f1] animate-[bounce_2s_infinite] z-20" />
            )}

            {/* Displaying Image or Sample Text Mockup */}
            {selectedImage ? (
              <div className="relative z-10 flex-1 flex items-center justify-center p-2">
                <img
                  src={selectedImage}
                  alt="Uploaded textbook page"
                  className="max-h-[320px] rounded-lg object-contain shadow-md"
                />
              </div>
            ) : selectedSample ? (
              <div className="relative z-10 flex-1 space-y-3 font-mono text-[11px] bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 text-slate-300 overflow-y-auto max-h-[320px]">
                <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider pb-1 border-b border-slate-800">
                  Document Scanner View • {selectedSample.pageNumber}
                </div>
                <p className="whitespace-pre-line leading-relaxed">{selectedSample.imageText}</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                <span className="text-xs">Select a sample page above or upload an image</span>
              </div>
            )}

            {/* Scan Trigger Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                {selectedImage ? 'Custom User Upload' : selectedSample?.title}
              </span>
              <button
                onClick={triggerOcrScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition shrink-0"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <ScanText className="w-4 h-4" />
                    <span>Run OCR Extraction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Extracted Content & Transformation Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 min-h-[360px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Extracted Academic Content
                </h3>
              </div>

              {extractedData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    title="Copy text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleTranslateScan('Spanish')}
                    disabled={isTranslating}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    title="Translate to Spanish"
                  >
                    <Globe className="w-3 h-3 text-indigo-400" />
                    <span>ES</span>
                  </button>
                </div>
              )}
            </div>

            {extractedData ? (
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-1">
                {/* Executive Summary */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">
                    Executive Summary:
                  </span>
                  <p>{extractedData.summary}</p>
                </div>

                {/* Key Concepts */}
                {extractedData.keyConcepts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Identified Concepts:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {extractedData.keyConcepts.map((kc, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs"
                        >
                          <span className="font-semibold text-indigo-300">{kc.term}: </span>
                          <span className="text-slate-400">{kc.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Extracted Text */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Verbatim OCR Transcription:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {extractedData.text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <ScanText className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs text-slate-400">
                  Ready to scan. Click <strong className="text-indigo-400">Run OCR Extraction</strong> on the left to analyze formulas, vocabulary, and textbook concepts.
                </p>
              </div>
            )}

            {/* Bottom Actions Row */}
            {extractedData && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  onClick={handleSaveToVectorDb}
                  disabled={isSavingVector}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSavingVector ? 'Indexing...' : 'Index Vector DB'}</span>
                </button>

                <button
                  onClick={handleGenerateNotesFromScan}
                  disabled={isGeneratingNotes}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isGeneratingNotes ? 'Synthesizing...' : 'Make Cornell Notes'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('tutor')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ask Tutor</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
