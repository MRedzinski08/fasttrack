import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

let cachedTier = null;
let cacheTime = 0;

export function useProStatus() {
  const [tier, setTier] = useState(cachedTier || 'free');
  const [loading, setLoading] = useState(!cachedTier);

  useEffect(() => {
    // Cache for 5 minutes
    if (cachedTier && Date.now() - cacheTime < 300000) {
      setTier(cachedTier);
      setLoading(false);
      return;
    }
    api.billing.status()
      .then((data) => {
        cachedTier = data.tier;
        cacheTime = Date.now();
        setTier(data.tier);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { isPro: tier === 'pro', tier, loading };
}

export default function ProGate({ feature, children }) {
  const { isPro, loading } = useProStatus();

  if (loading) return children;

  if (!isPro) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        {/* Blurred content */}
        <div className="blur-[6px] pointer-events-none select-none opacity-60">
          {children}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-3">
              <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </div>
            <p className="text-base sm:text-lg font-medium text-white">
              Upgrade to Pro in Settings to unlock {feature}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
