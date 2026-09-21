'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SaveNotification({ visible, isLightMode, message }: {
  visible: boolean;
  isLightMode: boolean;
  message: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-6 right-6 z-[90] max-w-[calc(100vw-3rem)]">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="save-confirmation"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${isLightMode ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-700 bg-slate-900 text-slate-100'}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isLightMode ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950 text-emerald-400'}`}>
              <Check size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold">Changes saved</p>
              <p className={`mt-0.5 text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
