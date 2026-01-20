import React from 'react';
import { Subscription } from '../types';
import { formatLimitMessage } from '../services/usageLimits';

interface UsageBannerProps {
  subscription: Subscription | null;
}

const UsageBanner: React.FC<UsageBannerProps> = ({ subscription }) => {
  if (!subscription || subscription.tier === 'team') return null;

  const message = formatLimitMessage(subscription);
  const isCritical = subscription?.callsUsed >= subscription.usageLimit - 2;

  return (
    <div className={`mx-auto max-w-xl mb-6 p-4 rounded-xl border ${
      isCritical
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-amber-50 border-amber-200 text-amber-800'
    }`}>
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm font-medium flex-1">{message}</p>
        {subscription.tier === 'free' && (
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all whitespace-nowrap">
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};

export default UsageBanner;
