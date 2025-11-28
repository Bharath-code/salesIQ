import React, { useState, useRef } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptView from './components/TranscriptView';
import SentimentChart from './components/SentimentChart';
import CoachingCard from './components/CoachingCard';
import { AnalysisResult, AppState } from './types';
import { analyzeSalesCall } from './services/gemini';
import { fileToBase64, getAudioDuration, downloadFullAnalysisAsCsv } from './utils/fileUtils';

// Increment this version to invalidate client-side cache when logic changes
const CACHE_VERSION = 'v2';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Cache to store analysis results: Key = file hash/metadata, Value = { result, duration }
  const analysisCache = useRef<Map<string, { result: AnalysisResult, duration: string }>>(new Map());
  
  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.UPLOADING);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      // Create object URL for playback (needed even for cached items)
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Check cache first
      // Using version + name + size + lastModified as a unique key
      const cacheKey = `${CACHE_VERSION}-${file.name}-${file.size}-${file.lastModified}`;
      
      if (analysisCache.current.has(cacheKey)) {
        console.log("Loading analysis from cache...");
        const cached = analysisCache.current.get(cacheKey)!;
        
        // Small delay to ensure state transition is smooth and noticeable
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setDuration(cached.duration);
        setAnalysisData(cached.result);
        setAppState(AppState.SUCCESS);
        return;
      }

      // Process file conversion and duration extraction in parallel
      const [base64Data, audioDuration] = await Promise.all([
        fileToBase64(file),
        getAudioDuration(file)
      ]);
      
      setDuration(audioDuration);
      setAppState(AppState.ANALYZING);
      
      // Call Gemini API
      const result = await analyzeSalesCall(base64Data, file.type);
      
      // Save to cache
      analysisCache.current.set(cacheKey, { result, duration: audioDuration });
      
      setAnalysisData(result);
      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("Failed to analyze audio. Please try again with a valid audio file.");
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  };

  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAppState(AppState.IDLE);
    setAnalysisData(null);
    setFileName('');
    setDuration('');
    setErrorMsg(null);
    setIsShareOpen(false);
  };

  const handleEmailShare = () => {
    if (!analysisData) return;
    const subject = encodeURIComponent(`Sales Analysis Report: ${fileName}`);
    const body = encodeURIComponent(
      `Here is the sales analysis report for ${fileName} (${duration}).\n\n` +
      `Summary:\n${analysisData.summary}\n\n` +
      `Topics:\n${analysisData.topics.join(', ')}\n\n` +
      `Strengths:\n${analysisData.coaching.strengths.map(s => `- ${s}`).join('\n')}\n\n` +
      `Improvements:\n${analysisData.coaching.improvements.map(s => `- ${s}`).join('\n')}\n`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsShareOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsShareOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExportCSV = () => {
    if (analysisData) {
      downloadFullAnalysisAsCsv(analysisData, fileName);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans pb-20 relative selection:bg-indigo-500/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">SalesIQ</h1>
          </div>
          {appState === AppState.SUCCESS && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 hover:bg-slate-50 rounded-md"
            >
              Analyze New Call
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* State: Idle / Uploading / Analyzing */}
        {(appState === AppState.IDLE || appState === AppState.UPLOADING || appState === AppState.ANALYZING || appState === AppState.ERROR) && (
          <div className="max-w-xl mx-auto mt-24">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Gemini 2.5 Flash
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Sales coaching <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">intelligence</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                Upload call recordings to get instant diarized transcripts, sentiment tracking, and actionable coaching feedback.
              </p>
            </div>

            {appState === AppState.ERROR && (
              <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorMsg}
              </div>
            )}

            {(appState === AppState.UPLOADING || appState === AppState.ANALYZING) ? (
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-16 flex flex-col items-center justify-center">
                <div className="mb-8">
                  <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {appState === AppState.UPLOADING ? 'Uploading...' : 'Analyzing conversation...'}
                </h3>
                <p className="text-slate-500 text-center text-sm max-w-xs mx-auto">
                  {appState === AppState.UPLOADING 
                    ? 'Encrypting and preparing your file.' 
                    : 'Gemini is diarizing speakers and extracting insights.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 overflow-hidden">
                <FileUpload onFileSelect={handleFileSelect} disabled={appState !== AppState.IDLE && appState !== AppState.ERROR} />
              </div>
            )}
          </div>
        )}

        {/* State: Success (Dashboard) */}
        {appState === AppState.SUCCESS && analysisData && (
          <div className="space-y-6 animate-fade-in-up pb-20">
             {/* Header Info */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Call Analysis</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    <p className="text-sm font-medium text-slate-500">{fileName}</p>
                    {duration && (
                      <>
                        <span className="text-slate-300">•</span>
                        <p className="text-sm font-medium text-slate-500">{duration}</p>
                      </>
                    )}
                </div>
              </div>
              <div className="flex gap-3 relative">
                 <button 
                  onClick={handleExportCSV}
                  className="h-9 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                 >
                   <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   Export CSV
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className="h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
                  >
                    Share
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isShareOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden ring-1 ring-slate-900/5">
                      <button 
                        onClick={handleEmailShare}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send via Email
                      </button>
                      <button 
                        onClick={handleCopyLink}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column: Metrics & Coaching */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* Sentiment Chart */}
                <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 p-6">
                   <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-slate-900">Engagement Flow</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Sentiment tracking over duration</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span>Score (0-100)</span>
                    </div>
                  </div>
                  <SentimentChart data={analysisData.sentiment} />
                </div>

                {/* Coaching Card */}
                <CoachingCard coaching={analysisData.coaching} summary={analysisData.summary} />
              
              </div>

              {/* Right Column: Transcript */}
              <div className="col-span-12 lg:col-span-5 h-[calc(100vh-12rem)] min-h-[600px] sticky top-24">
                <TranscriptView 
                  transcript={analysisData.transcript} 
                  fileName={fileName} 
                  topics={analysisData.topics || []}
                  audioUrl={audioUrl}
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce-up">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-sm">Link copied to clipboard</span>
        </div>
      )}
    </div>
  );
};

export default App;