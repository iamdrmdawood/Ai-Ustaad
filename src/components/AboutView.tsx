import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Award,
  Cpu,
  Brain,
  Database,
  ScanText,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Code2,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Bot,
  ExternalLink,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="space-y-10 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* 1. Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/25 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Generation Cognitive Learning Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">intellisnc - Ai Ustaad</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Born at the intersection of advanced Robotics, Artificial Intelligence, and Cognitive Science.
            We transform static physical textbooks into living vector intelligence, empowering students worldwide
            with an elite, 24/7 personal professor and researcher.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('tutor')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <span>Launch AI Ustaad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2"
            >
              <ScanText className="w-3.5 h-3.5 text-sky-400" />
              <span>Scan Textbook Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Founder & CEO Spotlight Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-indigo-500/30 p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-5">
            {/* Founder Avatar with Academic Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-200 font-mono">
                    MD
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-indigo-600 text-white border-2 border-slate-900 shadow">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Dr. Muhammad Dawood
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
                  CEO & Founder
                </span>
              </div>
              <p className="text-sm font-semibold text-sky-400 font-mono">
                PhD in Artificial Intelligence and Robotics
              </p>
              <p className="text-xs text-slate-400">
                Founder, Chief Architect & Visionary behind intellisnc
              </p>
            </div>
          </div>

          {/* Quick Credential Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Doctor of Philosophy</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>AI & Robotics Specialist</span>
            </span>
          </div>
        </div>

        {/* Founder Bio & Leadership Philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Leadership Vision & Philosophy</span>
            </h3>
            <p>
              <strong>Dr. Muhammad Dawood</strong> holds a PhD in Artificial Intelligence and Robotics,
              specializing in autonomous cognitive systems, neural perception, and machine intelligence.
              With extensive academic research and engineering leadership, Dr. Dawood established
              <strong> intellisnc</strong> to bridge the gap between high-level AI research and the daily
              challenges encountered by students globally.
            </p>
            <p>
              Recognizing that textbooks contain vast, dense knowledge that traditional search engines fail
              to synthesize, Dr. Dawood spearheaded the architecture of <em>Ai Ustaad</em> ("The Intelligent Teacher").
              His framework integrates state-of-the-art computer vision OCR, dense vector embedding indexing,
              and cognitive spaced repetition algorithms into an accessible, multilingual academic hub.
            </p>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20 italic text-slate-300">
              &ldquo;True educational equity begins when every student, regardless of language or background,
              has an indefatigable, world-class professor in their pocket who understands their textbooks
              down to the exact equation and page.&rdquo;
              <span className="block not-italic font-semibold text-right text-indigo-400 mt-2">
                — Dr. Muhammad Dawood, PhD
              </span>
            </div>
          </div>

          <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Research Domains
            </h4>
            <ul className="space-y-2.5">
              {[
                'Neural Vector Embeddings & Dense Retrieval',
                'Computer Vision & Structural STEM OCR',
                'Autonomous Robotics & Multi-Agent Planning',
                'Cognitive Decay & SuperMemo Interval Modeling',
                'Large Language Model Reasoning & Canvas Systems',
              ].map((domain, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{domain}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Platform Technical Architecture */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Underlying Architectural Pillars
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Engineered with deep mathematical rigor and state-of-the-art AI infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Database,
              color: 'text-indigo-400',
              title: 'Vector Database & Cosine Retrieval',
              desc: 'High-dimensional semantic embeddings with unit L2 normalization and cosine distance scoring for sub-second book retrieval.',
            },
            {
              icon: ScanText,
              color: 'text-sky-400',
              title: 'Textbook Computer Vision OCR',
              desc: 'Specialized document image preprocessing, adaptive binarization, and LaTeX equation transcription directly from camera captures.',
            },
            {
              icon: Calendar,
              color: 'text-emerald-400',
              title: 'Cognitive Spaced Repetition',
              desc: 'Algorithmic review schedules aligned with the Ebbinghaus forgetting curve and SuperMemo SM-2 interval calculations.',
            },
            {
              icon: Code2,
              color: 'text-amber-400',
              title: 'Claude & ChatGPT Canvas Mode',
              desc: 'Interactive dual-pane workspace with live code execution, 3D flip flashcards, and formatted Cornell Smart Notes export.',
            },
            {
              icon: Globe2,
              color: 'text-rose-400',
              title: '10-Language Multilingual Engine',
              desc: 'Cross-lingual reasoning support across English, Spanish, French, German, Mandarin, Hindi, Arabic, Japanese, Portuguese, and Korean.',
            },
            {
              icon: Bot,
              color: 'text-purple-400',
              title: 'Psychometric Adaptive Testing',
              desc: 'Automated quiz generation targeting Bloom’s Taxonomy, accompanied by distractor analysis and instant remediation.',
            },
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className={`w-4 h-4 ${pillar.color}`} />
                </div>
                <h4 className="text-xs font-bold text-white">{pillar.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Platform Metrics Summary */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-black text-indigo-400 font-mono">10</div>
          <div className="text-[11px] text-slate-400 mt-1">Global Languages</div>
        </div>
        <div>
          <div className="text-2xl font-black text-sky-400 font-mono">&lt; 150ms</div>
          <div className="text-[11px] text-slate-400 mt-1">Vector Query Latency</div>
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-400 font-mono">SM-2</div>
          <div className="text-[11px] text-slate-400 mt-1">Cognitive Memory Engine</div>
        </div>
        <div>
          <div className="text-2xl font-black text-amber-400 font-mono">24 / 7</div>
          <div className="text-[11px] text-slate-400 mt-1">AI Ustaad Guidance</div>
        </div>
      </div>
    </div>
  );
};
