export const createCheckoutSession = async (priceId: string) => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId })
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
  window.location.href = data.url;
};

export const createPortalSession = async () => {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const data = await response.json();
  window.location.href = data.url;
};

export const PRICES = {
  PRO_MONTHLY: process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',
  TEAM_MONTHLY: process.env.VITE_STRIPE_TEAM_MONTHLY_PRICE_ID || '',
  TEAM_YEARLY: process.env.VITE_STRIPE_TEAM_YEARLY_PRICE_ID || ''
};

export const TIERS = {
  free: {
    name: 'Starter',
    price: 0,
    callsLimit: 5,
    features: ['5 calls/month', 'Basic insights', 'Single user', 'Email support']
  },
  pro: {
    name: 'Pro',
    price: 29,
    callsLimit: 100,
    features: ['100 calls/month', 'All features', 'AI-powered coaching', 'Priority support', 'Advanced analytics']
  },
  team: {
    name: 'Team',
    price: 99,
    callsLimit: 500,
    features: ['500 calls/month', 'Team dashboard', 'Rep comparison', 'CRM exports', 'Dedicated support', 'White-label options']
  }
};