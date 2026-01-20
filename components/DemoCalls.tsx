import React from 'react';
import { AnalysisResult } from '../types';

const DEMO_CALL: AnalysisResult = {
  callType: 'discovery',
  verdict: 'Strong rapport built, but missed qualification on budget and timeline',
  summary: 'Excellent opening that built trust by researching the prospect company. Salesperson uncovered pain points well but failed to ask about budget approval or decision timeline. Follow up with ROI calculator to justify spend.',
  topics: ['Pain Discovery', 'Solution Fit', 'Pricing Discussion', 'Next Steps'],
  transcript: [
    { speaker: 'Salesperson', text: 'Hi Sarah, thanks for taking the time. I saw you just launched your new product line last month - congratulations on the coverage!', timestamp: '00:00', endTime: '00:08' },
    { speaker: 'Prospect', text: 'Thanks! Yeah, we\'re excited about the response so far.', timestamp: '00:08', endTime: '00:12' },
    { speaker: 'Salesperson', text: 'What\'s been the biggest challenge since launch?', timestamp: '00:12', endTime: '00:15' },
    { speaker: 'Prospect', text: 'Honestly, we\'re struggling with managing the increased customer support volume. Our team is overwhelmed.', timestamp: '00:15', endTime: '00:22' },
    { speaker: 'Salesperson', text: 'That\'s exactly why we built this - to automate 80% of those repetitive tickets. How would it impact your team to free up that much time?', timestamp: '00:22', endTime: '00:35' },
    { speaker: 'Prospect', text: 'That would be huge. We could focus on proactive customer success instead.', timestamp: '00:35', endTime: '00:40' },
    { speaker: 'Salesperson', text: 'Exactly. Our platform typically reduces support costs by 40% within the first quarter.', timestamp: '00:40', endTime: '00:48' },
    { speaker: 'Prospect', text: 'Sounds great. What\'s the pricing?', timestamp: '00:48', endTime: '00:50' },
    { speaker: 'Salesperson', text: 'We have three tiers starting at $499/month. Want me to send over the full pricing sheet?', timestamp: '00:50', endTime: '00:58' },
    { speaker: 'Prospect', text: 'Sure. Let me think about it and I\'ll get back to you.', timestamp: '00:58', endTime: '01:03' }
  ],
  sentiment: [
    { timePoint: '00:00', score: 85, context: 'Prospect engaged by personalized opening' },
    { timePoint: '00:15', score: 90, context: 'Prospect shares pain point openly' },
    { timePoint: '00:35', score: 95, context: 'High buy-in on solution value' },
    { timePoint: '00:50', score: 70, context: 'Engagement drops at pricing mention' },
    { timePoint: '00:58', score: 60, context: 'Prospect becomes defensive with "let me think about it"' }
  ],
  coaching: {
    strengths: [
      'Excellent pre-call research - referenced their recent product launch',
      'Strong discovery questions that uncovered real pain',
      'Positioned solution around their specific business value',
      'Clear value proposition with concrete metric (80% automation)'
    ],
    improvements: [
      'NEVER gave pricing without qualifying budget first - missed $500 vs $5,000 opportunity',
      'Failed to establish decision timeline - "when do you need this?"',
      'No urgency created - should have said "pricing changes next month"',
      'Missed opportunity to ask "who else needs to be involved?"'
    ]
  },
  riskAssessment: {
    score: 6,
    level: 'medium',
    reasons: [
      'Strong rapport established',
      'Clear pain point alignment',
      'Value proposition resonated'
    ],
    dealBreakers: [
      'Budget not qualified',
      'Decision timeline unclear',
      'No stakeholder mapping done'
    ]
  },
  salesMetrics: {
    talkRatio: 45,
    questionCount: 3,
    fillerWordCount: 2,
    longestMonologue: 12,
    buyingSignals: ['That would be huge', 'Sounds great'],
    riskSignals: ['Let me think about it', 'What\'s the pricing?']
  },
  objections: [
    {
      type: 'price',
      quote: 'What\'s the pricing?',
      timestamp: '00:48',
      rebuttalQuality: 'weak',
      suggestedRebuttal: 'Before we get to numbers, help me understand your budget range for this type of solution so I can show you the right fit.'
    },
    {
      type: 'timing',
      quote: 'Let me think about it',
      timestamp: '00:58',
      rebuttalQuality: 'missed',
      suggestedRebuttal: 'I understand you need time. What\'s your process for evaluating new tools? When would be a good time to reconvene?'
    }
  ],
  nextSteps: {
    primary: 'Send ROI calculator showing 6-month payback period',
    timeline: 'Within 24 hours',
    secondary: [
      'Research prospect company size and typical support budget',
      'Prepare case studies from similar companies',
      'Set up calendar link for follow-up call'
    ],
    followUpEmail: 'Hi Sarah,\n\nGreat speaking with you earlier! Based on our conversation about your support volume challenges, I wanted to share this ROI calculator showing how teams similar to yours see a 40% cost reduction within the first quarter.\n\nWhen would you be free for a 15-minute follow-up to review the numbers and see how this aligns with your budget?\n\nBest,\n[Your Name]'
  }
};

interface DemoCallsProps {
  onSelectDemo: (data: AnalysisResult, fileName: string, duration: string) => void;
}

const DemoCalls: React.FC<DemoCallsProps> = ({ onSelectDemo }) => {
  const handleTryDemo = () => {
    onSelectDemo(DEMO_CALL, 'Demo: Tech Startup Discovery Call', '1:03');
  };

  return (
    <div className="mt-12 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Try Demo</h3>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">No audio needed</span>
      </div>
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 shadow-lg shadow-indigo-200/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2">See it in action</h4>
            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
              Don't have a call ready? Try our demo analysis to see SalesIQ's AI coaching insights.
            </p>
            <button
              onClick={handleTryDemo}
              className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-md"
            >
              Load Demo Analysis
            </button>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoCalls;
