import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InfoHeader({ title, description }) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 relative" ref={popupRef}>
        <div className="w-4 h-[2px] bg-primary-500" />
        <span className="text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] text-primary-500 whitespace-nowrap">{title}</span>
        <button
          onClick={() => setOpen(!open)}
          className="w-3.5 h-3.5 rounded-full border border-primary-500 flex items-center justify-center text-primary-500 hover:bg-primary-500 hover:text-black transition-all duration-200 shrink-0"
        >
          <span className="text-[8px] font-bold font-display leading-none">i</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 bg-[#111] border border-white/[0.1] p-3 shadow-lg shadow-black/40 max-w-[280px] sm:max-w-sm"
            >
              <p className="text-xs text-white/50 leading-relaxed">{description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
