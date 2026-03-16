import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AddContributionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goalId: string;
  goalTitle: string;
  currentSaved: number;
}

export default function AddContributionModal({ open, onClose, onSuccess, goalId, goalTitle, currentSaved }: AddContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Insira um valor válido para o aporte.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from('goals')
        .update({ saved: currentSaved + parsedAmount })
        .eq('id', goalId);

      if (err) throw err;
      
      setAmount('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Erro ao registrar aporte. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
                <div className="flex items-center gap-2 text-emerald-600">
                  <PiggyBank className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Novo Aporte</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <p className="text-slate-500 text-sm">
                  Quanto você deseja adicionar para a meta <span className="font-bold text-slate-800">{goalTitle}</span>?
                </p>

                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0,00"
                    required
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-lg font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-emerald-50/20"
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : 'Confirmar Aporte'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
