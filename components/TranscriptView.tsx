import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TranscriptSegment } from '../types';
import { downloadTranscriptAsCsv } from '../utils/fileUtils';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
  fileName?: string;
  topics?: string[];
  audioUrl?: string | null;
  currentTime?: number;
  onSegmentClick?: (timestamp: string) => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  fileName = 'transcript',
  topics = [],
  audioUrl,
  currentTime = 0,
  onSegmentClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Helper to parse "MM:SS" to seconds
  const parseTimestamp = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const formatDuration = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}m ${s}s`;
  };

  const getDisplaySpeaker = (originalSpeaker: string) => {
    const lower = originalSpeaker.toLowerCase();
    if (lower === 'speaker a' || lower === 'speaker 1') return 'Salesperson';
    if (lower === 'speaker b' || lower === 'speaker 2') return 'Prospect';
    return originalSpeaker;
  };

  const speakerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    transcript.forEach(t => {
      const name = getDisplaySpeaker(t.speaker);
      const start = parseTimestamp(t.timestamp);
      const end = t.endTime ? parseTimestamp(t.endTime) : start + 2;
      const duration = Math.max(0, end - start);
      stats[name] = (stats[name] || 0) + duration;
    });
    return stats;
  }, [transcript]);

  const handleDownload = () => {
    downloadTranscriptAsCsv(transcript, fileName);
  };

  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const query = searchQuery.toLowerCase();
    return transcript.filter(segment =>
      segment.text.toLowerCase().includes(query) ||
      segment.speaker.toLowerCase().includes(query)
    );
  }, [transcript, searchQuery]);

  // Identify the currently active segment based on audio time
  const activeSegment = useMemo(() => {
    if (!transcript || transcript.length === 0) return null;

    // Find the last segment that has a start time <= current time
    for (let i = transcript.length - 1; i >= 0; i--) {
      const time = parseTimestamp(transcript[i].timestamp);
      if (time <= currentTime) {
        return transcript[i];
      }
    }
    return null;
  }, [transcript, currentTime]);

  useEffect(() => {
    if (activeSegmentRef.current && !searchQuery) {
      activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSegment, searchQuery]);

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-slate-900 font-medium px-0.5 rounded-[1px] shadow-sm">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden isolate">
      <div className="flex-none px-5 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">Transcript</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded-full border border-slate-100">
              {filteredTranscript.length} segments
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors px-2.5 py-1.5 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 sm:text-sm transition-all"
            placeholder="Find in transcript..."
          />
        </div>

        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  const target = transcript.find(s => s.text.toLowerCase().includes(topic.toLowerCase()));
                  if (target && onSegmentClick) {
                    onSegmentClick(target.timestamp);
                  }
                  setSearchQuery(topic);
                }}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200
                  ${searchQuery.toLowerCase() === topic.toLowerCase()
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white'
                  }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
        {filteredTranscript.map((segment, index) => {
          const displaySpeaker = getDisplaySpeaker(segment.speaker);
          const speakerLower = displaySpeaker.toLowerCase();
          const isProspect = speakerLower.includes('prospect') || speakerLower.includes('customer') || speakerLower.includes('client');
          const isActive = segment === activeSegment && !searchQuery;

          return (
            <div
              key={index}
              ref={isActive ? activeSegmentRef : null}
              onClick={() => onSegmentClick?.(segment.timestamp)}
              className={`flex flex-col max-w-[85%] group transition-all duration-200 ease-in-out cursor-pointer hover:opacity-100 ${isProspect ? 'items-start self-start' : 'items-end self-end ml-auto'}`}
            >
              <div className={`flex items-center space-x-2 mb-2 px-1 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'} ${isProspect ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                <div className="relative group/tooltip">
                  <span className={`text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 cursor-pointer ${isProspect ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-600 hover:text-indigo-800'}`}>
                    {displaySpeaker}
                  </span>
                  <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block z-50 whitespace-nowrap left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg relative tracking-wide">
                      Total time: {formatDuration(speakerStats[displaySpeaker] || 0)}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] font-mono transition-colors flex items-center ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-300'}`}>
                  {segment.timestamp}
                  {segment.endTime && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 font-normal text-slate-300">
                      - {segment.endTime}
                    </span>
                  )}
                </span>
              </div>
              <div
                className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed border shadow-sm transition-all duration-300 ease-out
                  ${isProspect
                    ? `bg-white text-slate-700 rounded-tl-sm ${isActive ? 'border-indigo-300 shadow-lg ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`
                    : `bg-indigo-600 text-white rounded-tr-sm ${isActive ? 'border-indigo-400 shadow-lg ring-1 ring-indigo-300' : 'border-indigo-600 hover:bg-indigo-700'}`
                  }
                  ${isActive ? 'scale-[1.02] transform' : 'hover:scale-[1.01] hover:shadow-md'}
                  `}
              >
                {renderHighlightedText(segment.text, searchQuery)}
              </div>
            </div>
          );
        })}
        {filteredTranscript.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 pb-10">
            <p className="text-sm font-medium text-slate-500">No matching segments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptView;