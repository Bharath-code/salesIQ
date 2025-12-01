import React from 'react';
import { CoachingData } from '../types';

interface CoachingCardProps {
  coaching: CoachingData;
  summary: string;
}

const CoachingCard: React.FC<CoachingCardProps> = ({ coaching, summary }) => {
  return (
    <div className="space-y-6">
      {/* Summary Section - Prominent Design */}
      <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
            Executive Summary
            </h3>
        </div>
        <p className="text-slate-700 leading-relaxed text-[15px]">{summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
          <h3 className="text-slate-900 font-semibold mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </span>
            Winning Moves
          </h3>
          <ul className="space-y-4">
            {coaching.strengths.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-6">
                <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0 opacity-60"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
          <h3 className="text-slate-900 font-semibold mb-5 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </span>
            Missed Opportunities
          </h3>
          <ul className="space-y-4">
            {coaching.improvements.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-6">
                <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 opacity-60"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoachingCard;