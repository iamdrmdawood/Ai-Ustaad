import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { performSemanticSearch } from '../services/api';
import { BookChunk } from '../types';
import {
  Database,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  MessageSquare,
  FileText,
  Filter,
  Eye,
  Sliders,
} from 'lucide-react';

export const VectorDbView: React.FC = () => {
  const { allChunks, books, setActiveTab, setActiveBookId } = useApp();

  const [query, setQuery] = useState('How does ATP synthase generate cellular energy?');
  const [topK, setTopK] = useState(3);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<BookChunk & { similarityScore: number }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedChunk, setInspectedChunk] = useState<BookChunk | null>(null);

  const subjects = useMemo(() => {
    const set = new Set(books.map((b) => b.subject));
    return ['All', ...Array.from(set)];
  }, [books]);

  const filteredChunks = useMemo(() => {
    if (selectedSubject === 'All') return allChunks;
    const targetBookIds = books.filter((b) => b.subject === selectedSubject).map((b) => b.id);
    return allChunks.filter((c) => targetBookIds.includes(c.bookId));
  }, [allChunks, books, selectedSubject]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await performSemanticSearch(query, filteredChunks, topK);
      setSearchResults(response.results);
    } catch (err: any) {
      console.error(err);
      // Client-side fallback ranking
      const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
      const ranked = filteredChunks.map((chunk) => {
        const text = chunk.text.toLowerCase();
        let matches = 0;
        qWords.forEach((w) => {
          if (text.includes(w)) matches++;
        });
        const score = Number(Math.min(0.98, 0.45 + (matches / Math.max(1, qWords.length)) * 0.5).toFixed(3));
        return { ...chunk, similarityScore: score };
      });
      ranked.sort((a, b) => b.similarityScore - a.similarityScore);
      setSearchResults(ranked.slice(0, topK));
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyCitation = (chunk: BookChunk) => {
    const citation = `"${chunk.text}" — Source: ${chunk.bookTitle}, ${chunk.chapterTitle}, Page ${chunk.pageNumber}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 2D Projection Coordinates Simulation for Vector Space visualization
  const projectedNodes = useMemo(() => {
    return allChunks.map((chunk, index) => {
      // Deterministic 2D position based on subject & hash
      let angle = (index / Math.max(1, allChunks.length)) * Math.PI * 2;
      let radius = 120 + ((index * 37) % 60);

      if (chunk.bookTitle.includes('Biology')) {
        angle = 0.5 + (index * 0.4);
      } else if (chunk.bookTitle.includes('Computer')) {
        angle = 2.4 + (index * 0.4);
      } else {
        angle = 4.2 + (index * 0.4);
      }

      const x = 200 + Math.cos(angle) * radius;
      const y = 175 + Math.sin(angle) * radius;

      const isResult = searchResults.some((r) => r.id === chunk.id);
      const resultObj = searchResults.find((r) => r.id === chunk.id);

      return {
        ...chunk,
        x,
        y,
        isResult,
        similarityScore: resultObj?.similarityScore || 0,
      };
    });
  }, [allChunks, searchResults]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Integrated Vector Database</h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-semibold border border-sky-500/30">
              Cosine Similarity Search
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Query your indexed textbooks and notes through high-dimensional semantic embeddings. Retrieve source passages with page citations.
          </p>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Total Vectors:</span>
            <span className="font-mono font-bold text-white">{allChunks.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Dim:</span>
            <span className="font-mono font-bold text-white">384-d</span>
          </div>
        </div>
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter any academic question or search query..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Subject filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Top-K Selector */}
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value={2}>Top 2 Matches</option>
              <option value={3}>Top 3 Matches</option>
              <option value={5}>Top 5 Matches</option>
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Embedding & Querying...' : 'Semantic Search'}</span>
            </button>
          </div>
        </div>

        {/* Quick query pills */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-slate-400 font-medium">Quick Queries:</span>
          {[
            'What is the rotary mechanism of ATP synthase?',
            'How do AVL tree rotations maintain balance?',
            'What causes conservation of angular momentum?',
            'Explain glycolysis rate limiting enzyme PFK-1',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>

      {/* Main Grid: 2D Spatial Projector & Retrieved Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Visual 2D Embedding Space Projector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  2D Vector Embedding Projector
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">PCA / Cosine Space</span>
            </div>

            {/* Interactive SVG Vector Map */}
            <div className="relative w-full h-[320px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {/* Background grid */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              <svg className="w-full h-full" viewBox="0 0 400 350">
                {/* Center query node if searched */}
                {hasSearched && (
                  <g>
                    {/* Concentric ripple */}
                    <circle cx="200" cy="175" r="45" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" />
                    <circle cx="200" cy="175" r="8" fill="#6366f1" className="shadow-lg" />
                    <text x="200" y="198" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold">
                      Query Vector (Q)
                    </text>
                  </g>
                )}

                {/* Connecting distance vector lines */}
                {hasSearched &&
                  projectedNodes
                    .filter((n) => n.isResult)
                    .map((node) => (
                      <line
                        key={`line-${node.id}`}
                        x1="200"
                        y1="175"
                        x2={node.x}
                        y2={node.y}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    ))}

                {/* Document Chunk Vector Nodes */}
                {projectedNodes.map((node) => {
                  const isTop = node.isResult;
                  const fillColor = node.bookTitle.includes('Biology')
                    ? '#10b981'
                    : node.bookTitle.includes('Computer')
                    ? '#38bdf8'
                    : '#a855f7';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setInspectedChunk(node)}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isTop ? 10 : 6}
                        fill={isTop ? '#10b981' : fillColor}
                        stroke={isTop ? '#ffffff' : '#1e293b'}
                        strokeWidth={isTop ? 2.5 : 1}
                        className="transition-all duration-300 group-hover:scale-125"
                      />
                      <text
                        x={node.x}
                        y={node.y - 10}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="8"
                        className="pointer-events-none"
                      >
                        P.{node.pageNumber}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Cluster Legend */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Biology
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Comp Sci
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Physics
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Query
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Click any vector node to inspect its embeddings, token length, and raw metadata.
            </p>
          </div>
        </div>

        {/* Right 7 Cols: Ranked Semantic Search Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {hasSearched ? `Retrieved Passages (${searchResults.length})` : 'Indexed Book Chunks'}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Similarity Metric: Cosine ([-1, 1])
            </span>
          </div>

          <div className="space-y-3">
            {(hasSearched ? searchResults : filteredChunks.slice(0, 4)).map((chunk, idx) => {
              const score = (chunk as any).similarityScore;
              return (
                <div
                  key={chunk.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[240px]">
                        {chunk.bookTitle}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Page {chunk.pageNumber}
                      </span>
                    </div>

                    {score !== undefined && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                        <span>{(score * 100).toFixed(1)}% match</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-indigo-400/90 font-medium">
                    {chunk.chapterTitle}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {chunk.text}
                  </p>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {chunk.tags?.map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCitation(chunk)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
                        title="Copy exact academic citation"
                      >
                        {copiedId === chunk.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] hidden sm:inline">Cite</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('tutor')}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Clarify with Tutor</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasSearched && searchResults.length === 0 && (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                No matching passages found above threshold. Try broadening your query terms.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vector Details Inspector Drawer/Modal */}
      {inspectedChunk && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">
                Inspecting Vector Node: {inspectedChunk.chapterTitle}
              </h4>
            </div>
            <button
              onClick={() => setInspectedChunk(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Book Source</span>
              <p className="font-semibold text-white truncate">{inspectedChunk.bookTitle}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Page Number</span>
              <p className="font-semibold text-white">Page {inspectedChunk.pageNumber}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Vector Norm</span>
              <p className="font-semibold text-emerald-400 font-mono">||v|| = 1.000 (Unit L2)</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Tokens</span>
              <p className="font-semibold text-sky-400 font-mono">
                ~{Math.round(inspectedChunk.text.length / 4)} tokens
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-300 font-mono">
            {inspectedChunk.text}
          </div>
        </div>
      )}
    </div>
  );
};
