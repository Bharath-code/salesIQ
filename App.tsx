import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptView from './components/TranscriptView';
import SentimentChart from './components/SentimentChart';
import CoachingCard from './components/CoachingCard';
import SalesIntelligence from './components/SalesIntelligence';
import Auth from './components/Auth';
import { AnalysisResult, AppState } from './types';
import { analyzeSalesCall } from './services/gemini';
import { supabase } from './services/supabase';
import { fileToBase64, getAudioDuration, downloadFullAnalysisAsCsv } from './utils/fileUtils';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Track Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRecentUploads([]);
        handleReset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load History from Supabase
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setRecentUploads(data || []);
    }
  };

  // Simulate progress bar behavior
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (appState === AppState.UPLOADING) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 35) return 35;
          return prev + 2;
        });
      }, 100);
    } else if (appState === AppState.ANALYZING) {
      setProgress(prev => Math.max(prev, 35));
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 0.4;
        });
      }, 150);
    } else if (appState === AppState.SUCCESS) {
      setProgress(100);
    } else if (appState === AppState.IDLE || appState === AppState.ERROR) {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [appState]);

  const handleRecentSelect = async (callId: string) => {
    const call = recentUploads.find(c => c.id === callId);
    if (!call) return;

    setAppState(AppState.UPLOADING);
    await new Promise(resolve => setTimeout(resolve, 300));

    setFileName(call.file_name);
    setDuration(call.duration || 'N/A');
    setAnalysisData(call.analysis_result);
    setAudioUrl(call.audio_url || null);
    setAppState(AppState.SUCCESS);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;

    setAppState(AppState.UPLOADING);
    setErrorMsg(null);
    setFileName(file.name);

    let currentUrl: string | null = null;

    try {
      currentUrl = URL.createObjectURL(file);
      setAudioUrl(currentUrl);

      const [base64Data, audioDuration] = await Promise.all([
        fileToBase64(file),
        getAudioDuration(file)
      ]);

      setDuration(audioDuration);
      setAppState(AppState.ANALYZING);

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('calls')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        if (uploadError.message.includes('Bucket not found')) {
          setToastMessage("⚠️ Supabase Storage: 'calls' bucket not found. Please create it in the dashboard.");
        } else {
          setToastMessage("⚠️ Storage upload failed. Using local audio link.");
        }
        // Fallback to local URL but continue analysis
      }

      const { data: { publicUrl } } = supabase.storage
        .from('calls')
        .getPublicUrl(filePath);

      // 2. Execute AI Analysis
      const result = await analyzeSalesCall(base64Data, file.type);

      // 3. Persist to Database
      const { data: savedCall, error: dbError } = await supabase
        .from('calls')
        .insert({
          user_id: user.id,
          file_name: file.name,
          duration: audioDuration,
          analysis_result: result,
          verdict: result.verdict,
          risk_score: result.riskAssessment?.score,
          call_type: result.callType,
          audio_url: publicUrl // Store the permanent URL
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setAnalysisData(result);
      setAudioUrl(publicUrl); // Switch to permanent URL
      setAppState(AppState.SUCCESS);
      fetchHistory(); // Refresh history

    } catch (err: any) {
      console.error("Analysis Failure:", err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAppState(AppState.IDLE);
    setAnalysisData(null);
    setFileName('');
    setDuration('');
    setErrorMsg(null);
    setIsShareOpen(false);
    setProgress(0);
  };

  const generateReportText = () => {
    if (!analysisData) return '';
    return `
CALL ANALYSIS REPORT: ${fileName}
Duration: ${duration}

EXECUTIVE SUMMARY:
${analysisData.summary}

KEY TOPICS:
${analysisData.topics.join(', ')}

WINNING MOVES (Strengths):
${analysisData.coaching.strengths.map(s => `• ${s}`).join('\n')}

MISSED OPPORTUNITIES (Improvements):
${analysisData.coaching.improvements.map(s => `• ${s}`).join('\n')}
    `.trim();
  };

  const handleEmailShare = () => {
    if (!analysisData) return;
    const subject = encodeURIComponent(`Sales Analysis Report: ${fileName}`);
    const body = encodeURIComponent(generateReportText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsShareOpen(false);
  };

  const handleCopyReport = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    setIsShareOpen(false);
    showToast("Full report copied to clipboard");
  };

  const handleCopyTranscript = () => {
    if (!analysisData) return;
    const text = analysisData.transcript.map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsShareOpen(false);
    showToast("Transcript text copied to clipboard");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    if (analysisData) {
      downloadFullAnalysisAsCsv(analysisData, fileName);
    }
  };

  // If not logged in, show Auth Screen
  if (!user) {
    return <Auth onAuthSuccess={() => { }} />;
  }

  const handleSeek = (timestamp: string) => {
    const audio = document.getElementById('main-audio-player') as HTMLAudioElement;
    if (audio) {
      const parts = timestamp.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      audio.currentTime = seconds;
      audio.play().catch(() => { });
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans pb-20 relative selection:bg-indigo-500/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => appState === AppState.SUCCESS ? handleReset() : null}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">SalesIQ</h1>
          </div>

          <div className="flex items-center gap-4">
            {appState === AppState.SUCCESS && (
              <button
                onClick={handleReset}
                className="text-sm font-bold text-indigo-700 hover:text-indigo-800 transition-all px-4 py-2 hover:bg-indigo-50 rounded-xl border border-indigo-100 bg-white shadow-sm"
              >
                Analyze New Call
              </button>
            )}
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Premium Plan</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 overflow-hidden"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* State: Idle / Uploading / Analyzing */}
        {(appState === AppState.IDLE || appState === AppState.UPLOADING || appState === AppState.ANALYZING || appState === AppState.ERROR) && (
          <div className="max-w-xl mx-auto mt-16 pb-20">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Powered by Gemini 3 Flash
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Close more deals with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI Intelligence</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                Upload your sales calls and let SalesIQ extract the hidden signals that win deals.
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
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 flex flex-col items-center justify-center w-full max-w-lg mx-auto backdrop-blur-sm bg-white/80">
                <div className="w-full max-w-xs space-y-5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>{appState === AppState.UPLOADING ? 'Uploading Audio' : 'AI Analysis in Progress'}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-out shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <p className="text-center text-slate-400 text-sm animate-pulse font-medium">
                    {appState === AppState.UPLOADING
                      ? 'Securing your data...'
                      : 'Gemini is decoding deep sales signals...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
                  <FileUpload onFileSelect={handleFileSelect} disabled={appState !== AppState.IDLE && appState !== AppState.ERROR} />
                </div>

                {/* Recent Sessions List */}
                {recentUploads.length > 0 && (
                  <div className="mt-12 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Your Call Vault</h3>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{recentUploads.length} CALLS</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {recentUploads.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleRecentSelect(item.id)}
                          className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer transition-all duration-300"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors border border-slate-100 group-hover:border-indigo-100">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3-2zm0 0v-6.2M9 19l12-3M9 12.8V6" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                {item.file_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.duration}</span>
                                <span className="text-slate-300">•</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.risk_score >= 8 ? 'text-emerald-500' :
                                  item.risk_score >= 5 ? 'text-amber-500' : 'text-red-500'
                                  }`}>
                                  Health: {item.risk_score}/10
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              OPEN ANALYSIS
                            </span>
                            <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* State: Success (Dashboard) */}
        {appState === AppState.SUCCESS && analysisData && (
          <div className="space-y-6 animate-fade-in-up pb-20">
            {/* Header Info */}
            <div className="flex items-center justify-between py-2 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  Call Performance Insights
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest">REAL-TIME</span>
                </h2>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{fileName}</p>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-bold text-slate-600">{duration}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 relative">
                <button
                  onClick={handleExportCSV}
                  className="h-10 px-5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Analysis
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className="h-10 px-5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95"
                  >
                    Share Report
                    <svg className={`${isShareOpen ? 'rotate-180' : ''} w-3.5 h-3.5 opacity-70 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isShareOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 z-50 py-2 overflow-hidden ring-1 ring-slate-900/5 animate-fade-in-up">
                      <button
                        onClick={handleCopyReport}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        Full Report
                      </button>
                      <button
                        onClick={handleCopyTranscript}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        Plain Transcript
                      </button>
                      <button
                        onClick={handleEmailShare}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Email Stakeholders
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              {/* Left Column: Metrics & Coaching */}
              <div className="col-span-12 lg:col-span-7 space-y-8">
                {/* Sales Intelligence Section */}
                <SalesIntelligence
                  verdict={analysisData.verdict}
                  callType={analysisData.callType}
                  riskAssessment={analysisData.riskAssessment}
                  salesMetrics={analysisData.salesMetrics}
                  nextSteps={analysisData.nextSteps}
                  objections={analysisData.objections}
                />

                {/* Sentiment Chart */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Emotional Velocity</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">Real-time engagement signal monitoring</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 uppercase tracking-widest">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                      <span>Engagement (0-100)</span>
                    </div>
                  </div>
                  <SentimentChart data={analysisData.sentiment} onPointClick={handleSeek} />
                </div>

                {/* Coaching Card */}
                <CoachingCard coaching={analysisData.coaching} summary={analysisData.summary} />
              </div>

              {/* Right Column: Transcript */}
              <div className="col-span-12 lg:col-span-5 h-[calc(100vh-14rem)] min-h-[700px] sticky top-28">
                <TranscriptView
                  transcript={analysisData.transcript}
                  fileName={fileName}
                  topics={analysisData.topics || []}
                  audioUrl={audioUrl}
                  currentTime={currentTime}
                  onSegmentClick={handleSeek}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Sticky Audio Player */}
      {appState === AppState.SUCCESS && (
        <div className="fixed bottom-0 left-0 w-full z-50 animate-fade-in-up">
          <div className="max-w-4xl mx-auto mb-6 px-4">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3-2zm0 0v-6.2M9 19l12-3M9 12.8V6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{fileName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{duration}</p>
                  </div>
                </div>

                {!audioUrl ? (
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-medium text-slate-400 italic">Local audio recording required for playback</p>
                    <label className="h-9 px-4 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer active:scale-95">
                      LINK LOCAL AUDIO
                      <input
                        type="file"
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAudioUrl(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <audio
                    id="main-audio-player"
                    src={audioUrl}
                    controls
                    className="h-10 w-full max-w-lg"
                    controlsList="nodownload"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-gradient-to-tr from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc]"></div>
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none -z-10 rounded-full"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-violet-500/5 blur-[120px] pointer-events-none -z-10 rounded-full"></div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-32 right-10 bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-4 z-50 animate-bounce-up border border-white/10">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;