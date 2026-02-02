import { AnalysisResult, CallType } from '../types';

export interface CallRecord {
    id: string;
    file_name: string;
    duration: string;
    risk_score: number;
    call_type: CallType;
    analysis_result: AnalysisResult;
    created_at: string;
}

export interface AggregateStats {
    totalCalls: number;
    avgRiskScore: number;
    avgTalkRatio: number;
    avgQuestionsPerCall: number;
    totalFillerWords: number;
    avgMonologueLength: number;
    winRate: number; // Percentage of calls with score >= 8
    callTypeDistribution: Record<CallType, number>;
    objectionTypeBreakdown: Record<string, number>;
    weeklyTrend: { week: string; avgScore: number; count: number }[];
    strongRebuttals: number;
    weakRebuttals: number;
    missedRebuttals: number;
}

export function calculateAggregateStats(calls: CallRecord[]): AggregateStats {
    if (calls.length === 0) {
        return {
            totalCalls: 0,
            avgRiskScore: 0,
            avgTalkRatio: 0,
            avgQuestionsPerCall: 0,
            totalFillerWords: 0,
            avgMonologueLength: 0,
            winRate: 0,
            callTypeDistribution: {} as Record<CallType, number>,
            objectionTypeBreakdown: {},
            weeklyTrend: [],
            strongRebuttals: 0,
            weakRebuttals: 0,
            missedRebuttals: 0,
        };
    }

    let totalRiskScore = 0;
    let totalTalkRatio = 0;
    let totalQuestions = 0;
    let totalFillerWords = 0;
    let totalMonologue = 0;
    let highScoreCalls = 0;
    let strongRebuttals = 0;
    let weakRebuttals = 0;
    let missedRebuttals = 0;

    const callTypeDistribution: Record<string, number> = {};
    const objectionTypeBreakdown: Record<string, number> = {};
    const weeklyData: Record<string, { total: number; count: number }> = {};

    for (const call of calls) {
        const result = call.analysis_result;
        const score = call.risk_score ?? result?.riskAssessment?.score ?? 0;

        totalRiskScore += score;
        if (score >= 8) highScoreCalls++;

        // Sales metrics
        if (result?.salesMetrics) {
            totalTalkRatio += result.salesMetrics.talkRatio ?? 0;
            totalQuestions += result.salesMetrics.questionCount ?? 0;
            totalFillerWords += result.salesMetrics.fillerWordCount ?? 0;
            totalMonologue += result.salesMetrics.longestMonologue ?? 0;
        }

        // Call type distribution
        const callType = call.call_type ?? result?.callType ?? 'other';
        callTypeDistribution[callType] = (callTypeDistribution[callType] ?? 0) + 1;

        // Objection analysis
        if (result?.objections) {
            for (const obj of result.objections) {
                objectionTypeBreakdown[obj.type] = (objectionTypeBreakdown[obj.type] ?? 0) + 1;

                if (obj.rebuttalQuality === 'strong') strongRebuttals++;
                else if (obj.rebuttalQuality === 'weak') weakRebuttals++;
                else if (obj.rebuttalQuality === 'missed') missedRebuttals++;
            }
        }

        // Weekly trend
        const date = new Date(call.created_at);
        const weekStart = getWeekStart(date);
        if (!weeklyData[weekStart]) {
            weeklyData[weekStart] = { total: 0, count: 0 };
        }
        weeklyData[weekStart].total += score;
        weeklyData[weekStart].count++;
    }

    const weeklyTrend = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8) // Last 8 weeks
        .map(([week, data]) => ({
            week: formatWeekLabel(week),
            avgScore: Math.round((data.total / data.count) * 10) / 10,
            count: data.count,
        }));

    return {
        totalCalls: calls.length,
        avgRiskScore: Math.round((totalRiskScore / calls.length) * 10) / 10,
        avgTalkRatio: Math.round(totalTalkRatio / calls.length),
        avgQuestionsPerCall: Math.round((totalQuestions / calls.length) * 10) / 10,
        totalFillerWords,
        avgMonologueLength: Math.round(totalMonologue / calls.length),
        winRate: Math.round((highScoreCalls / calls.length) * 100),
        callTypeDistribution: callTypeDistribution as Record<CallType, number>,
        objectionTypeBreakdown,
        weeklyTrend,
        strongRebuttals,
        weakRebuttals,
        missedRebuttals,
    };
}

function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
    const date = new Date(weekStart);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getScoreColor(score: number): string {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
    if (score >= 8) return 'bg-emerald-50 border-emerald-200';
    if (score >= 6) return 'bg-amber-50 border-amber-200';
    if (score >= 4) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
}
