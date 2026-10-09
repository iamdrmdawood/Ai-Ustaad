import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendTutorClarification } from '../services/api';
import { ChatMessage } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Globe,
  HelpCircle,
  Copy,
  Check,
  User,
  Bot,
} from 'lucide-react';

export const ChatTutorView: React.FC = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChatHistory,
    books,
    activeBookId,
    activeBook,
    allChunks,
    language,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookForContext, setSelectedBookForContext] = useState<string>('all');
  const [tutorPersona, setTutorPersona] = useState<'socratic' | 'stepByStep' | 'eli5' | 'examPrep'>('stepByStep');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMsg);
    setIsLoading(true);

    try {
      // Gather context chunks based on selected book
      let contextDocs: Array<{ title: string; page: number; text: string }> = [];

      if (selectedBookForContext === 'all') {
        contextDocs = allChunks.slice(0, 5).map((c) => ({
          title: c.bookTitle,
          page: c.pageNumber,
          text: c.text,
        }));
      } else {
        const b = books.find((x) => x.id === selectedBookForContext);
        if (b) {
          contextDocs = b.chunks.slice(0, 5).map((c) => ({
            title: b.title,
            page: c.pageNumber,
            text: c.text,
          }));
        }
      }

      // Format messages history
      const history = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await sendTutorClarification(
        history,
        contextDocs,
        language,
        tutorPersona === 'socratic'
          ? 'Socratic Guide (lead with guided hints and questions)'
          : tutorPersona === 'eli5'
          ? 'Simple Intuition & Real-World Analogies'
          : tutorPersona === 'examPrep'
          ? 'Rigorous Exam Preparation & Common Pitfalls'
          : 'Step-by-Step Problem Solving & Clear Academic Derivations'
      );

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(botMsg);
    } catch (err: any) {
      console.error(err);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: '⚠️ I had trouble connecting to the model. Please check your network or try asking again.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-w-4xl mx-auto space-y-4 animate-fade-in pb-12">
      {/* Header & Context Grounding Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">OmniScholar AI Tutor</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">Grounded on Books</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time clarification, math derivation & multilingual study support.
            </p>
          </div>
        </div>

        {/* Persona & Book Grounding Selectors */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Grounding Book */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedBookForContext}
              onChange={(e) => setSelectedBookForContext(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none max-w-[140px] truncate cursor-pointer text-[11px]"
            >
              <option value="all">All Indexed Books</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* Coaching Mode */}
          <select
            value={tutorPersona}
            onChange={(e) => setTutorPersona(e.target.value as any)}
            className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none cursor-pointer text-[11px]"
          >
            <option value="stepByStep">Step-by-Step Solver</option>
            <option value="socratic">Socratic Coach</option>
            <option value="eli5">Intuitive (ELI5)</option>
            <option value="examPrep">Exam Prep Drillmaster</option>
          </select>

          <button
            onClick={clearChatHistory}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4">
        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl space-y-2 relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Bottom actions for model message */}
                {!isUser && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
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
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>OmniScholar is analyzing your book chunks & formulating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] shrink-0 scrollbar-none">
        <span className="text-slate-400 font-medium shrink-0">Suggestions:</span>
        {[
          'Explain Chemiosmosis and the F0/F1 rotary engine',
          'Why does an AVL tree guarantee O(log N) search?',
          'What is the law of conservation of angular momentum?',
          'Give me a mnemonic to memorize glycolysis enzymes',
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInputPrompt(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative flex gap-2 shrink-0">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Ask your AI tutor anything in ${language}...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 shrink-0"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
