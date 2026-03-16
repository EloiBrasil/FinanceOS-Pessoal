import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, PiggyBank } from 'lucide-react';

interface SetSavingsGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (goal: number) => void;
  currentGoal: number;
}

export default function SetSavingsGoalModal({ open, onClose, onSuccess, currentGoal }: SetSavingsGoalModalProps) {
  const [goal, setGoal] = useState(currentGoal.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setGoal(currentGoal.toString());
      setError(null);
    }
  }, [open, currentGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGoal = Number(goal.replace(/[^0-9.]/g, ''));
    
    if (isNaN(numGoal) || numGoal < 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    onSuccess(numGoal);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50">
                    <PiggyBank className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Meta de Economia</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quanto você quer poupar por mês?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                    <input
                      autoFocus
                      type="text"
                      value={goal}
                      onChange={e => setGoal(e.target.value)}
                      placeholder="0,00"
                      required
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-200 hover:bg-amber-600"
                  >
                    Definir Meta
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
