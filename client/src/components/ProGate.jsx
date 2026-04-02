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
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred content */}
        <div className="blur-[6px] pointer-events-none select-none opacity-60">
          {children}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-4xl font-display font-bold text-primary-500/20 select-none">PRO</span>
          <p className="text-xs uppercase tracking-[0.15em] text-white/40 mt-2">Upgrade in Settings</p>
        </div>
      </div>
    );
  }

  return children;
}
