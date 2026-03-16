import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

interface GoalPredictionModalProps {
  open: boolean;
  onClose: () => void;
  goalTitle: string;
  total: number;
  saved: number;
}

export default function GoalPredictionModal({ open, onClose, goalTitle, total, saved }: GoalPredictionModalProps) {
  const [targetDate, setTargetDate] = useState('');
  
  const remaining = total - saved;

  const calculation = useMemo(() => {
    if (!targetDate || remaining <= 0) return null;

    const today = new Date();
    const target = new Date(targetDate + '-02'); // Use day 02 to avoid timezone shifts
    
    if (isNaN(target.getTime())) return null;

    // Calculate difference in months
    const months = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());

    if (months <= 0) return { error: 'A data deve ser no futuro!' };

    const monthlyRequired = remaining / months;

    return {
      monthlyRequired,
      months,
      remaining
    };
  }, [targetDate, remaining]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 text-primary">
                  <Calculator className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Previsão de Meta</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-6">
                <div>
                  <p className="text-slate-500 text-sm mb-4">
                    Quando você deseja atingir a meta <span className="font-bold text-slate-800">{goalTitle}</span>?
                  </p>
                  
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mês e Ano Alvo</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="month"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {calculation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {'error' in calculation ? (
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 italic text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {calculation.error}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl relative overflow-hidden group">
                            <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Economia Mensal Necessária</p>
                            <h3 className="text-3xl font-black text-primary tracking-tight">
                              R$ {calculation.monthlyRequired.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Tempo</p>
                              <p className="text-sm font-bold text-slate-700">{calculation.months} meses</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Faltam</p>
                              <p className="text-sm font-bold text-slate-700">R$ {calculation.remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
