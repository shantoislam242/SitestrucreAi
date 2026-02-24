import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  LayoutTemplate, 
  Eye, 
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Upload,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeBusinessContent } from './services/gemini';
import { WebsiteStructure, WebsiteSection, SectionType } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_SECTIONS = Object.values(SectionType);

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WebsiteStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section Selection State
  const [requestedSections, setRequestedSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');

  const extractTextFromPdf = async (file: File) => {
    setIsExtractingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      setPdfText(fullText);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Failed to extract text from PDF. Please try again or paste text manually.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      extractTextFromPdf(file);
    } else if (file) {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() && !pdfText) {
      setError('Please provide a business description or upload a PDF.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeBusinessContent(input, {
        requestedSections: requestedSections.length > 0 ? requestedSections : undefined,
        pdfText: pdfText || undefined
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    setRequestedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const addCustomSection = () => {
    if (newSection.trim() && !requestedSections.includes(newSection.trim())) {
      setRequestedSections(prev => [...prev, newSection.trim()]);
      setNewSection('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.4)]">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">SiteStructure <span className="text-brand-500">AI</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-500">
            <span className="text-brand-500 font-medium">Analyze</span>
            <ArrowRight className="w-4 h-4" />
            <span>Structure</span>
            <ArrowRight className="w-4 h-4" />
            <span>Build</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className={cn(
            "lg:col-span-5 space-y-8 transition-all duration-500",
            result ? "lg:col-span-4" : "lg:col-span-8 lg:col-start-3"
          )}>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {result ? "Refine Content" : "Build your framework"}
              </h2>
              <p className="text-zinc-400">
                Upload a document or describe your business. We'll generate a structured website plan with a green-shaded aesthetic.
              </p>
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Business Document (PDF)
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                  pdfFile ? "border-brand-500 bg-brand-500/5" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf" 
                  className="hidden" 
                />
                {pdfFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="text-brand-500 w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                      <p className="text-xs text-zinc-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); setPdfText(''); }}
                      className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
                      <Upload className="text-zinc-500 w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload PDF</p>
                      <p className="text-xs text-zinc-500 mt-1">or drag and drop</p>
                    </div>
                  </>
                )}
              </div>
              {isExtractingPdf && (
                <div className="flex items-center gap-2 text-xs text-brand-500 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Extracting content from PDF...
                </div>
              )}
            </div>

            {/* Section Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <LayoutTemplate className="w-3 h-3" />
                Requested Sections
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SECTIONS.map(section => (
                  <button
                    key={section}
                    onClick={() => toggleSection(section)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      requestedSections.includes(section)
                        ? "bg-brand-500/20 border-brand-500/50 text-brand-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    {section}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Add custom section..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSection()}
                />
                <button 
                  onClick={addCustomSection}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {requestedSections.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {requestedSections.filter(s => !DEFAULT_SECTIONS.includes(s as any)).map(s => (
                    <div key={s} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                      {s}
                      <button onClick={() => toggleSection(s)}><X className="w-3 h-3 hover:text-red-400" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" />
                {pdfFile ? "Additional Context (Optional)" : "Business Description"}
              </label>
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={pdfFile 
                    ? "Add any specific instructions or context not found in the PDF..." 
                    : "Describe your business, mission, and services..."
                  }
                  className="input-field h-48 resize-none"
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (!input.trim() && !pdfText)}
                    className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          {/* Results Panel */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-8 space-y-8"
              >
                <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">Generated Framework</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white">{result.businessName}</h2>
                    <p className="text-lg text-zinc-500 italic">"{result.tagline}"</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors relative"
                      title="Copy JSON"
                    >
                      {copied ? <Check className="w-5 h-5 text-brand-500" /> : <Copy className="w-5 h-5 text-zinc-400" />}
                    </button>
                    <button 
                      onClick={() => { setResult(null); setInput(''); setPdfFile(null); setPdfText(''); setRequestedSections([]); }}
                      className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
                      title="Start Over"
                    >
                      <RefreshCw className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-6">
                  {result.sections.map((section, idx) => (
                    <SectionCard key={idx} section={section} index={idx} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-600 text-sm">
          <p>© {new Date().getFullYear()} SiteStructure AI. Built by Shanto Islam.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionCard({ section, index }: { section: WebsiteSection, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-2xl overflow-hidden group hover:border-brand-500/30 transition-all duration-500 green-glow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Left: Section Label & Layout Info */}
        <div className="md:w-64 p-6 bg-zinc-900/30 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-brand-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              {section.type}
            </div>
            <h3 className="font-bold text-lg leading-tight mb-2 text-white group-hover:text-brand-400 transition-colors">{section.title}</h3>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Layout Suggestion</p>
              <p className="text-sm font-medium text-zinc-300">{section.layoutSuggestion}</p>
            </div>
            {section.visualCues && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Visual Cues</p>
                <p className="text-xs text-zinc-500 italic leading-relaxed">{section.visualCues}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Content & Key Points */}
        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Copy / Messaging</p>
            <p className="text-zinc-300 leading-relaxed text-sm">{section.content}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Key Elements to Include</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {section.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
