import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendTutorClarification, performSemanticSearch } from '../services/api';
import { ChatMessage, Artifact } from '../types';
import { ArtifactCanvasPanel } from './ArtifactCanvasPanel';
import {
  MessageSquare,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  User,
  Bot,
  Plus,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  Sliders,
  Layers,
  Code2,
  FileText,
  HelpCircle,
  Search,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  X,
  Globe,
  Compass,
  FileSearch,
  BookMarked,
  RefreshCw,
} from 'lucide-react';

export const ChatTutorView: React.FC = () => {
  const {
    books,
    allChunks,
    language,
    threads,
    activeThreadId,
    activeThread,
    createNewThread,
    switchThread,
    deleteThread,
    renameThread,
    addChatMessage,
    clearChatHistory,
    activeArtifact,
    setActiveArtifact,
    reasoningEnabled,
    setReasoningEnabled,
    setActiveTab,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatusText, setSearchStatusText] = useState<string>('');
  const [selectedBookForContext, setSelectedBookForContext] = useState<string>('all');
  const [searchInLibraryEnabled, setSearchInLibraryEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
  const [expandedCitationsIds, setExpandedCitationsIds] = useState<Record<string, boolean>>({});

  // In-chat message search bar (Search within this chat)
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Citation inspector popup
  const [inspectedCitation, setInspectedCitation] = useState<{
    title: string;
    page: number;
    snippet: string;
    similarityScore?: number;
  } | null>(null);

  // Image attachment
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thread sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threadSearch, setThreadSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeThread?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleThinking = (msgId: string) => {
    setExpandedThinkingIds((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const toggleCitations = (msgId: string) => {
    setExpandedCitationsIds((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputPrompt.trim();
    if ((!promptToSend && !attachedImage) || isLoading) return;

    const currentImage = attachedImage;
    setInputPrompt('');
    setAttachedImage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend || 'Please analyze this textbook page / image.',
      imageAttachment: currentImage || undefined,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMsg);
    setIsLoading(true);
    setSearchStatusText('🔍 Performing vector search in book database...');

    try {
      // 1. DYNAMIC VECTOR SEARCH: retrieve the most relevant passages for this query
      let candidateChunks = allChunks;
      if (selectedBookForContext !== 'all') {
        candidateChunks = allChunks.filter((c) => c.bookId === selectedBookForContext);
      }

      let retrievedCitations: Array<{
        title: string;
        page: number;
        snippet: string;
        similarityScore?: number;
      }> = [];

      let contextDocs: Array<{ title: string; page: number; text: string }> = [];

      if (searchInLibraryEnabled && candidateChunks.length > 0) {
        try {
          const searchResult = await performSemanticSearch(promptToSend, candidateChunks, 4);
          if (searchResult.results && searchResult.results.length > 0) {
            retrievedCitations = searchResult.results.map((r) => ({
              title: r.bookTitle,
              page: r.pageNumber,
              snippet: r.text,
              similarityScore: r.similarityScore,
            }));

            contextDocs = searchResult.results.map((r) => ({
              title: r.bookTitle,
              page: r.pageNumber,
              text: r.text,
            }));
          }
        } catch (searchErr) {
          console.warn('Vector search fallback:', searchErr);
        }
      }

      // If no search results found, fallback to candidate sample chunks
      if (contextDocs.length === 0 && candidateChunks.length > 0) {
        contextDocs = candidateChunks.slice(0, 3).map((c) => ({
          title: c.bookTitle,
          page: c.pageNumber,
          text: c.text,
        }));
      }

      setSearchStatusText('Synthesizing academic answer & checking citations...');

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        imageAttachment: m.imageAttachment,
      }));

      const res = await sendTutorClarification(
        history,
        contextDocs,
        language,
        'University / College (Academic Rigor & First-Principles Derivation)',
        reasoningEnabled,
        currentImage || undefined
      );

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        thoughtProcess: res.thoughtProcess,
        artifact: res.artifact,
        citations: retrievedCitations.length > 0 ? retrievedCitations : undefined,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(botMsg);

      // Auto-open artifact in canvas if returned
      if (res.artifact) {
        setActiveArtifact(res.artifact);
      }
    } catch (err: any) {
      console.error(err);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: '⚠️ I encountered an issue connecting to the model. Please check network and retry.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      setSearchStatusText('');
    }
  };

  // Continue search action within the same chat
  const handleContinueSearch = (lastMessageContent: string) => {
    const topicSummary = lastMessageContent.slice(0, 80).replace(/[*#_`]/g, '').trim();
    const followUpSearchPrompt = `Continue search in the books: Find additional relevant passages, deeper formulas, and edge cases related to "${topicSummary}". Ground the response in the next best retrieved passages.`;
    handleSend(undefined, followUpSearchPrompt);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const clean = text.replace(/[*#_`$]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const copyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(threadSearch.toLowerCase())
  );

  // In-chat search matching logic
  const inChatMatchesCount = React.useMemo(() => {
    if (!inChatSearchQuery.trim()) return 0;
    const q = inChatSearchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q)).length;
  }, [messages, inChatSearchQuery]);

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[580px] w-full rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden animate-fade-in shadow-2xl relative">
      {/* 1. Claude / ChatGPT Style Left Sidebar (Threads & History) */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 ${
          sidebarOpen ? 'w-64 p-3' : 'w-0 p-0 overflow-hidden'
        }`}
      >
        <div className="space-y-3 overflow-hidden">
          {/* New Chat Button */}
          <button
            onClick={createNewThread}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>New Study Chat</span>
          </button>

          {/* Search Chats */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Thread List */}
          <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Recent Chats
            </div>
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => switchThread(thread.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium border border-slate-700/80 shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate text-xs">{thread.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Spec Badge */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Model:</span>
            </div>
            <span className="font-mono text-indigo-300 font-semibold">Gemini 3.8 Flash</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Center Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Chat Bar */}
        <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Toggle Chat Sidebar"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-white">Intellisnc Ai</h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-mono">Continuous Vector Search</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: In-Chat Search, Vector Grounding Book & Reasoning Toggle */}
          <div className="flex items-center gap-2">
            {/* Search WITHIN THIS CHAT Toggle Button */}
            <button
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition ${
                showInChatSearch || inChatSearchQuery
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Search keywords inside this chat"
            >
              <FileSearch className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Find in Chat</span>
            </button>

            {/* Book Grounding Pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedBookForContext}
                onChange={(e) => setSelectedBookForContext(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none max-w-[130px] truncate cursor-pointer"
              >
                <option value="all">All Books Grounding</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Deep Reasoning Toggle */}
            <button
              onClick={() => setReasoningEnabled(!reasoningEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition ${
                reasoningEnabled
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Step-by-Step Chain-of-Thought Reasoning"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Reasoning</span>
              <span className="text-[10px] font-bold font-mono">
                {reasoningEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Canvas Toggle if artifact exists */}
            {activeArtifact && (
              <button
                onClick={() => setActiveArtifact(activeArtifact ? null : activeArtifact)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Canvas</span>
              </button>
            )}

            <button
              onClick={clearChatHistory}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Clear Thread"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* IN-CHAT MESSAGE SEARCH BAR (When active) */}
        {showInChatSearch && (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 animate-fade-in text-xs">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={inChatSearchQuery}
                onChange={(e) => setInChatSearchQuery(e.target.value)}
                placeholder="Find in this chat (formulas, terms, answers)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
            {inChatSearchQuery && (
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {inChatMatchesCount} {inChatMatchesCount === 1 ? 'match' : 'matches'}
              </span>
            )}
            <button
              onClick={() => {
                setShowInChatSearch(false);
                setInChatSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Starter cards if only welcome message */}
          {messages.length <= 1 && (
            <div className="max-w-2xl mx-auto py-6 space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  Intellisnc Ai • Study & Semantic Search
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ask questions, search book passages, and continuously deepen your search within the same chat without losing conversational context.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    title: 'Derive Chemiosmotic ATP Synthase',
                    desc: 'Step-by-step rotational mechanism & proton motive force equation',
                    prompt: 'Explain the rotary motor mechanism of ATP synthase and derive the proton motive force formula step-by-step.',
                  },
                  {
                    title: 'Generate Balanced AVL Tree Code',
                    desc: 'Create runnable Python class with Left-Right rotations',
                    prompt: 'Generate a clean Python class implementing an AVL tree with rotation invariant proofs and test cases.',
                  },
                  {
                    title: 'Conservation of Angular Momentum',
                    desc: 'Solve torque differential equations and moment of inertia',
                    prompt: 'Explain conservation of angular momentum and the parallel-axis theorem with worked textbook examples.',
                  },
                  {
                    title: 'Synthesize Cornell Notes & Quiz',
                    desc: 'Transform book concepts into a complete study deck',
                    prompt: 'Create comprehensive Cornell study notes and a 3-question mastery quiz on cellular respiration.',
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(undefined, card.prompt)}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-left transition group space-y-1"
                  >
                    <div className="font-semibold text-white group-hover:text-indigo-300 transition flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasThinking = Boolean(msg.thoughtProcess);
            const isThinkingExpanded = expandedThinkingIds[msg.id] ?? false;
            const hasCitations = Boolean(msg.citations && msg.citations.length > 0);
            const isCitationsExpanded = expandedCitationsIds[msg.id] ?? false;

            // Highlight matches if in-chat search query active
            const isMatchingSearch =
              inChatSearchQuery.trim().length > 0 &&
              msg.content.toLowerCase().includes(inChatSearchQuery.toLowerCase());

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                } ${isMatchingSearch ? 'ring-2 ring-sky-400/50 rounded-2xl p-1' : ''}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[80%] space-y-3 ${
                    isUser
                      ? 'bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl rounded-tl-none shadow-md'
                  }`}
                >
                  {/* User image attachment if present */}
                  {isUser && msg.imageAttachment && (
                    <div className="mb-2">
                      <img
                        src={msg.imageAttachment}
                        alt="User scan attachment"
                        className="max-h-48 rounded-lg object-contain border border-indigo-400/30"
                      />
                    </div>
                  )}

                  {/* IN-CHAT RETRIEVED SOURCES & CITATIONS ACCORDION */}
                  {!isUser && hasCitations && (
                    <div className="rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-hidden">
                      <button
                        onClick={() => toggleCitations(msg.id)}
                        className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900/70 flex items-center justify-between text-slate-300 transition text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Searched {msg.citations!.length} textbook passages in vector database
                          </span>
                        </div>
                        {isCitationsExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {isCitationsExpanded && (
                        <div className="p-2.5 border-t border-slate-800 space-y-2 bg-slate-950/90">
                          {msg.citations!.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => setInspectedCitation(c)}
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 cursor-pointer transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-[11px] truncate">
                                    {c.title}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                                    P.{c.page}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {c.snippet}
                                </p>
                              </div>
                              {c.similarityScore !== undefined && (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                                  {(c.similarityScore * 100).toFixed(1)}% match
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Claude / ChatGPT Style Thinking / Reasoning Accordion */}
                  {!isUser && hasThinking && (
                    <div className="rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden text-xs">
                      <button
                        onClick={() => toggleThinking(msg.id)}
                        className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-900/60 flex items-center justify-between text-slate-400 hover:text-slate-200 transition text-[11px] font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span>Thought Process & Academic Reasoning</span>
                        </div>
                        {isThinkingExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isThinkingExpanded && (
                        <div className="p-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap bg-slate-950/80">
                          {msg.thoughtProcess}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversational Text Content */}
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Claude Style Interactive Artifact Card */}
                  {!isUser && msg.artifact && (
                    <div
                      onClick={() => setActiveArtifact(msg.artifact!)}
                      className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 hover:border-indigo-400 hover:bg-slate-900 cursor-pointer transition flex items-center justify-between gap-3 group shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                          {msg.artifact.type === 'code' ? (
                            <Code2 className="w-4 h-4" />
                          ) : msg.artifact.type === 'quiz' ? (
                            <HelpCircle className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs group-hover:text-indigo-300 transition">
                              {msg.artifact.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-indigo-500/20 text-indigo-300 font-semibold">
                              {msg.artifact.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Click to view and edit in Canvas panel
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                        <span>Open Canvas</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  {/* CONTINUE SEARCH WITHIN THE SAME CHAT BUTTON & Action Bar */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                      {/* Deepen / Continue Search Button */}
                      <button
                        onClick={() => handleContinueSearch(msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 font-medium transition"
                        title="Search more related textbook passages in the database without starting a new chat"
                      >
                        <Search className="w-3 h-3 text-indigo-400" />
                        <span>Continue search in books</span>
                      </button>

                      <div className="flex items-center gap-2 ml-auto">
                        <span className="font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => speakText(msg.content)}
                          className="hover:text-indigo-400 transition"
                          title="Read aloud"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="hover:text-indigo-400 transition"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 shadow">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none flex items-center gap-2.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>{searchStatusText || 'Intellisnc Ai is processing your request...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Advanced Prompt Bar (With in-chat Search Mode toggle) */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0 space-y-2">
          {/* Image preview badge if attached */}
          {attachedImage && (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
              <img
                src={attachedImage}
                alt="Attachment preview"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="text-xs text-slate-300">Book Scan Attached</span>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => handleSend(e)}
            className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-2xl p-2 shadow-inner"
          >
            {/* Attachment paperclip */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition"
              title="Attach Textbook Scan / Diagram"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* In-Chat Continuous Vector Search Mode Toggle (Like ChatGPT Search icon) */}
            <button
              type="button"
              onClick={() => setSearchInLibraryEnabled(!searchInLibraryEnabled)}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
                searchInLibraryEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
              title="Toggle Vector Book Search for this chat"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">
                {searchInLibraryEnabled ? 'Search: ON' : 'Search: OFF'}
              </span>
            </button>

            {/* Input area */}
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask or continue search in ${language}... (e.g., 'Search more on step 2', 'Explain ATP formula')`}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-2"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={(!inputPrompt.trim() && !attachedImage) || isLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow transition flex items-center gap-1.5 shrink-0"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. Claude / ChatGPT Style Side-by-Side Artifacts Canvas Panel */}
      {activeArtifact && (
        <ArtifactCanvasPanel
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
          onSendFollowUp={(prompt) => handleSend(undefined, prompt)}
        />
      )}

      {/* 5. Passage Inspection Modal (when student clicks any citation) */}
      {inspectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white truncate max-w-xs">
                  {inspectedCitation.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedCitation(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Page {inspectedCitation.page}</span>
              {inspectedCitation.similarityScore !== undefined && (
                <span className="font-mono text-emerald-400 font-bold">
                  Similarity: {(inspectedCitation.similarityScore * 100).toFixed(1)}%
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans max-h-60 overflow-y-auto">
              {inspectedCitation.snippet}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const citation = inspectedCitation;
                  setInspectedCitation(null);
                  handleSend(
                    undefined,
                    `Explain this passage from ${citation.title} (Page ${citation.page}) in depth: "${citation.snippet.slice(0, 100)}..."`
                  );
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
              >
                <span>Explain this in chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
