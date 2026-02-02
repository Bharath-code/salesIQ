import React from 'react';
import { AggregateStats, getScoreColor, getScoreBgColor } from '../utils/statsUtils';

interface RepPerformanceDashboardProps {
    stats: AggregateStats;
    onAnalyzeNew: () => void;
}

const RepPerformanceDashboard: React.FC<RepPerformanceDashboardProps> = ({ stats, onAnalyzeNew }) => {
    if (stats.totalCalls === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-20 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">No Performance Data Yet</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Analyze your first sales call to start tracking your performance metrics and see insights here.
                </p>
                <button
                    onClick={onAnalyzeNew}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                >
                    Analyze Your First Call
                </button>
            </div>
        );
    }

    const totalRebuttals = stats.strongRebuttals + stats.weakRebuttals + stats.missedRebuttals;
    const rebuttalScore = totalRebuttals > 0
        ? Math.round((stats.strongRebuttals / totalRebuttals) * 100)
        : 0;

    return (
        <div className="space-y-8 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Performance Overview
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Aggregated insights from <span className="font-semibold text-indigo-600">{stats.totalCalls}</span> analyzed calls
                    </p>
                </div>
                <button
                    onClick={onAnalyzeNew}
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                    + Analyze New Call
                </button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <HeroStat
                    label="Total Calls"
                    value={stats.totalCalls.toString()}
                    icon={<CallIcon />}
                    color="indigo"
                />
                <HeroStat
                    label="Avg Deal Health"
                    value={stats.avgRiskScore.toString()}
                    suffix="/10"
                    icon={<HealthIcon />}
                    color={stats.avgRiskScore >= 7 ? 'emerald' : stats.avgRiskScore >= 5 ? 'amber' : 'red'}
                />
                <HeroStat
                    label="Talk Ratio"
                    value={`${stats.avgTalkRatio}%`}
                    icon={<TalkIcon />}
                    color={stats.avgTalkRatio <= 40 ? 'emerald' : stats.avgTalkRatio <= 55 ? 'amber' : 'red'}
                    subtitle={stats.avgTalkRatio <= 40 ? 'Excellent' : stats.avgTalkRatio <= 55 ? 'Good' : 'Too High'}
                />
                <HeroStat
                    label="Win Rate"
                    value={`${stats.winRate}%`}
                    icon={<TrophyIcon />}
                    color={stats.winRate >= 70 ? 'emerald' : stats.winRate >= 50 ? 'amber' : 'orange'}
                />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Call Metrics Card */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        Call Metrics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <MetricBox label="Avg Questions" value={stats.avgQuestionsPerCall.toString()} color="indigo" />
                        <MetricBox label="Total Fillers" value={stats.totalFillerWords.toString()} color="amber" />
                        <MetricBox label="Avg Monologue" value={`${stats.avgMonologueLength}s`} color="slate" />
                    </div>
                </div>

                {/* Call Type Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Call Types
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.callTypeDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([type, count]) => (
                                <CallTypeBar
                                    key={type}
                                    type={type}
                                    count={count}
                                    total={stats.totalCalls}
                                />
                            ))}
                        {Object.keys(stats.callTypeDistribution).length === 0 && (
                            <p className="text-sm text-slate-400 italic">No call type data</p>
                        )}
                    </div>
                </div>

                {/* Objection Handling */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Objection Handling
                        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {totalRebuttals} total
                        </span>
                    </h3>
                    {totalRebuttals > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
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
                                            className={rebuttalScore >= 70 ? 'text-emerald-500' : rebuttalScore >= 40 ? 'text-amber-500' : 'text-red-500'}
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            strokeDasharray={`${rebuttalScore}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">
                                        {rebuttalScore}%
                                    </span>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <RebuttalBar label="Strong" count={stats.strongRebuttals} total={totalRebuttals} color="emerald" />
                                    <RebuttalBar label="Weak" count={stats.weakRebuttals} total={totalRebuttals} color="amber" />
                                    <RebuttalBar label="Missed" count={stats.missedRebuttals} total={totalRebuttals} color="red" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">No objection data yet</p>
                    )}
                </div>

                {/* Objection Types */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Common Objections
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.objectionTypeBreakdown)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([type, count]) => (
                                <ObjectionBadge key={type} type={type} count={count} />
                            ))}
                        {Object.keys(stats.objectionTypeBreakdown).length === 0 && (
                            <p className="text-sm text-slate-400 italic">No objections recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Trend */}
            {stats.weeklyTrend.length > 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Performance Trend
                    </h3>
                    <div className="flex items-end justify-between gap-2 h-32">
                        {stats.weeklyTrend.map((week, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className={`w-full rounded-t-lg transition-all ${week.avgScore >= 7 ? 'bg-emerald-500' : week.avgScore >= 5 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ height: `${(week.avgScore / 10) * 100}%`, minHeight: '8px' }}
                                    title={`${week.avgScore}/10 (${week.count} calls)`}
                                />
                                <div className="text-center">
                                    <p className="text-xs font-bold text-slate-600">{week.avgScore}</p>
                                    <p className="text-[10px] text-slate-400">{week.week}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components
const HeroStat: React.FC<{
    label: string;
    value: string;
    suffix?: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}> = ({ label, value, suffix, icon, color, subtitle }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2`} />
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center text-${color}-600 mb-3`}>
            {icon}
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">
            {value}<span className="text-lg text-slate-400">{suffix}</span>
        </p>
        {subtitle && <p className={`text-xs font-medium text-${color}-600 mt-1`}>{subtitle}</p>}
    </div>
);

const MetricBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="text-center p-4 bg-slate-50 rounded-xl">
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
);

const CallTypeBar: React.FC<{ type: string; count: number; total: number }> = ({ type, count, total }) => {
    const percentage = Math.round((count / total) * 100);
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 capitalize w-20">{type}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-bold text-slate-500 w-12 text-right">{count} ({percentage}%)</span>
        </div>
    );
};

const RebuttalBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
    const percentage = Math.round((count / total) * 100);
    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase text-${color}-600 w-14`}>{label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="text-[10px] font-medium text-slate-500 w-6 text-right">{count}</span>
        </div>
    );
};

const ObjectionBadge: React.FC<{ type: string; count: number }> = ({ type, count }) => {
    const colorMap: Record<string, string> = {
        price: 'bg-red-100 text-red-700 border-red-200',
        timing: 'bg-amber-100 text-amber-700 border-amber-200',
        authority: 'bg-purple-100 text-purple-700 border-purple-200',
        need: 'bg-blue-100 text-blue-700 border-blue-200',
        competitor: 'bg-orange-100 text-orange-700 border-orange-200',
        other: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${colorMap[type] ?? colorMap.other}`}>
            {type} <span className="opacity-60">×{count}</span>
        </span>
    );
};

// Icons
const CallIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const HealthIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TalkIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const TrophyIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export default RepPerformanceDashboard;
