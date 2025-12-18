import React from 'react';
import { RiskAssessment, SalesMetrics, NextSteps, Objection } from '../types';

interface SalesIntelligenceProps {
    verdict?: string;
    callType?: string;
    riskAssessment?: RiskAssessment;
    salesMetrics?: SalesMetrics;
    nextSteps?: NextSteps;
    objections?: Objection[];
}

const SalesIntelligence: React.FC<SalesIntelligenceProps> = ({
    verdict,
    callType,
    riskAssessment,
    salesMetrics,
    nextSteps,
    objections
}) => {
    // Return null if essential data is missing
    if (!riskAssessment || !salesMetrics || !nextSteps) {
        return null;
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'bg-emerald-500';
            case 'medium': return 'bg-amber-500';
            case 'high': return 'bg-orange-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-slate-500';
        }
    };

    const getRiskBgColor = (level: string) => {
        switch (level) {
            case 'low': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'high': return 'bg-orange-50 border-orange-200 text-orange-700';
            case 'critical': return 'bg-red-50 border-red-200 text-red-700';
            default: return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    const getObjectionTypeColor = (type: string) => {
        switch (type) {
            case 'price': return 'bg-red-100 text-red-700 border-red-200';
            case 'timing': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'authority': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'need': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'competitor': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getRebuttalBadge = (quality: string) => {
        switch (quality) {
            case 'strong': return 'bg-emerald-100 text-emerald-700';
            case 'weak': return 'bg-amber-100 text-amber-700';
            case 'missed': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getTalkRatioFeedback = (ratio: number) => {
        if (ratio <= 40) return { text: 'Excellent', color: 'text-emerald-600' };
        if (ratio <= 50) return { text: 'Good', color: 'text-amber-600' };
        if (ratio <= 60) return { text: 'Too High', color: 'text-orange-600' };
        return { text: 'Way Too High', color: 'text-red-600' };
    };

    const talkRatio = salesMetrics.talkRatio ?? 0;
    const talkFeedback = getTalkRatioFeedback(talkRatio);
    const riskLevel = riskAssessment.level ?? 'medium';
    const riskScore = riskAssessment.score ?? 5;
    const reasons = riskAssessment.reasons ?? [];
    const dealBreakers = riskAssessment.dealBreakers ?? [];
    const buyingSignals = salesMetrics.buyingSignals ?? [];
    const riskSignals = salesMetrics.riskSignals ?? [];
    const secondary = nextSteps.secondary ?? [];
    const objectionsList = objections ?? [];

    const copyFollowUpEmail = () => {
        if (nextSteps.followUpEmail) {
            navigator.clipboard.writeText(nextSteps.followUpEmail);
        }
    };

    return (
        <div className="space-y-6">
            {/* Verdict Banner */}
            {verdict && (
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Verdict</span>
                        {callType && (
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium capitalize">
                                {callType} call
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-semibold leading-snug">{verdict}</p>
                </div>
            )}

            {/* Risk Score + Sales Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deal Risk Card */}
                <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Deal Health
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskBgColor(riskLevel)} border`}>
                            {riskLevel} risk
                        </span>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className={getRiskColor(riskLevel).replace('bg-', 'text-')}
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                    strokeDasharray={`${riskScore * 10}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
                                {riskScore}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 mb-2">Score out of 10</p>
                            <div className="space-y-1">
                                {reasons.slice(0, 2).map((reason, idx) => (
                                    <p key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                        {reason}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Deal Breakers */}
                    {dealBreakers.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">⚠️ Deal Breakers</p>
                            <ul className="space-y-1">
                                {dealBreakers.map((item, idx) => (
                                    <li key={idx} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Sales Metrics Card */}
                <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        Call Metrics
                    </h3>

                    <div className="space-y-4">
                        {/* Talk Ratio Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Talk Ratio</span>
                                <span className={`font-semibold ${talkFeedback.color}`}>
                                    {talkRatio}% ({talkFeedback.text})
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${talkRatio <= 40 ? 'bg-emerald-500' :
                                            talkRatio <= 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(talkRatio, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Target: 30-40%</p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-indigo-600">{salesMetrics.questionCount ?? 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Questions</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-amber-600">{salesMetrics.fillerWordCount ?? 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Fillers</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-600">{salesMetrics.longestMonologue ?? 0}s</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Max Mono</p>
                            </div>
                        </div>

                        {/* Signals */}
                        {buyingSignals.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">✓ Buying Signals</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {buyingSignals.map((signal, idx) => (
                                        <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 truncate max-w-full">
                                            "{signal}"
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {riskSignals.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1.5">⚠ Risk Signals</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {riskSignals.map((signal, idx) => (
                                        <span key={idx} className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-200 truncate max-w-full">
                                            "{signal}"
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Objections Section */}
            {objectionsList.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Objection Analysis
                        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {objectionsList.length} objection{objectionsList.length !== 1 ? 's' : ''}
                        </span>
                    </h3>

                    <div className="space-y-4">
                        {objectionsList.map((obj, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getObjectionTypeColor(obj.type)}`}>
                                        {obj.type}
                                    </span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getRebuttalBadge(obj.rebuttalQuality)}`}>
                                        {obj.rebuttalQuality === 'strong' ? '✓ Handled Well' :
                                            obj.rebuttalQuality === 'weak' ? '⚠ Weak Rebuttal' : '✗ Missed'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{obj.timestamp}</span>
                                </div>
                                <p className="text-sm text-slate-700 italic mb-2">"{obj.quote}"</p>
                                {obj.suggestedRebuttal && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded p-2 mt-2">
                                        <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">💡 Better Rebuttal</p>
                                        <p className="text-xs text-indigo-900">{obj.suggestedRebuttal}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Steps Card */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Next Steps
                </h3>

                {/* Primary Action */}
                {nextSteps.primary && (
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-indigo-700 uppercase">Priority Action</span>
                            {nextSteps.timeline && (
                                <span className="text-xs font-medium text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">{nextSteps.timeline}</span>
                            )}
                        </div>
                        <p className="text-slate-800 font-medium">{nextSteps.primary}</p>
                    </div>
                )}

                {/* Secondary Actions */}
                {secondary.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Also Do</p>
                        <ul className="space-y-2">
                            {secondary.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Follow-up Email */}
                {nextSteps.followUpEmail && (
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">📧 Follow-up Email Draft</p>
                            <button
                                onClick={copyFollowUpEmail}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{nextSteps.followUpEmail}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesIntelligence;
