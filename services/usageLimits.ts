import { Subscription, SubscriptionTier } from '../types';

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  pro: 100,
  team: 500
};

export const getCallsRemaining = (subscription: Subscription | null): number => {
  if (!subscription) return TIER_LIMITS.free;

  const limit = TIER_LIMITS[subscription.tier];
  return Math.max(0, limit - subscription.callsUsed);
};

export const canUploadCall = (subscription: Subscription | null): boolean => {
  return getCallsRemaining(subscription) > 0;
};

export const hasExceededLimit = (subscription: Subscription | null): boolean => {
  return !canUploadCall(subscription);
};

export const formatLimitMessage = (subscription: Subscription | null): string => {
  const tier = subscription?.tier || 'free';
  const used = subscription?.callsUsed || 0;
  const limit = TIER_LIMITS[tier];
  const remaining = limit - used;

  if (remaining <= 0) {
    return `You've used all ${limit} calls this month. Upgrade to continue.`;
  }

  if (remaining <= 2) {
    return `${remaining} call${remaining === 1 ? '' : 's'} remaining this month. Upgrade soon!`;
  }

  return `${remaining} calls remaining this month`;
};

export const getDefaultSubscription = (): Subscription => {
  return {
    id: 'default',
    tier: 'free',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    usageLimit: TIER_LIMITS.free,
    callsUsed: 0
  };
};
