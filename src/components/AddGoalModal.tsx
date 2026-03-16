import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, DollarSign, Calendar, Palette, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  editingGoal?: {
    id: string;
    title: string;
    total: number;
    saved: number;
    monthlyContribution: number;
    deadline: string;
    color: string;
    priority: 'urgente' | 'breve' | 'longo';
  } | null;
}

const GOAL_COLORS = [
  '#1773cf', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#475569'
];

export default function AddGoalModal({ open, onClose, onSuccess, userId, editingGoal }: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [saved, setSaved] = useState('');
  const [deadline, setDeadline] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [color, setColor] = useState('#1773cf');
  const [priority, setPriority] = useState<'urgente' | 'breve' | 'longo'>('longo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingGoal) {
        setTitle(editingGoal.title);
        setTotal(editingGoal.total.toString());
        setSaved(editingGoal.saved.toString());
        setDeadline(editingGoal.deadline || '');
        setMonthlyContribution(editingGoal.monthlyContribution?.toString() || '');
        setColor(editingGoal.color);
        setPriority(editingGoal.priority);
      } else {
        setTitle(''); setTotal(''); setSaved(''); setDeadline('');
        setMonthlyContribution(''); setColor('#1773cf'); setPriority('longo');
      }
      setError(null);
    }
  }, [open, editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(total.replace(',', '.'));
    const parsedSaved = parseFloat(saved.replace(',', '.') || '0');
    const parsedMonthly = parseFloat(monthlyContribution.replace(',', '.') || '0');

    if (!title.trim() || isNaN(parsedTotal) || parsedTotal <= 0) {
      setError('Preencha o título e o valor total da meta.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const goalData = {
        user_id: userId,
        title: title.trim(),
        total: parsedTotal,
        saved: parsedSaved,
        monthly_contribution: parsedMonthly,
        deadline: deadline.trim() || null,
        color,
        priority,
        icon: 'Target', 
      };

      let res;
      if (editingGoal) {
        res = await supabase.from('goals').update(goalData).eq('id', editingGoal.id);
      } else {
        res = await supabase.from('goals').insert(goalData);
      }

      if (res.error) throw res.error;
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Erro ao salvar meta. Tente novamente.');
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Título da Meta</label>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="ex: Viagem para Europa, Reserva de Emergência..."
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Valor Total (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={total}
                        onChange={e => setTotal(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="0,00"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Já Poupado (R$)</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={saved}
                        onChange={e => setSaved(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="0,00"
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Aporte Mensal (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyContribution}
                      onChange={e => setMonthlyContribution(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="Opcional"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Prazo Estimado</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        placeholder="ex: Dez 2025"
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-3">Prioridade</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'urgente', label: 'Urgente', color: 'rose' },
                      { id: 'breve', label: 'Em breve', color: 'amber' },
                      { id: 'longo', label: 'Longo prazo', color: 'emerald' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id as any)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          priority === p.id 
                            ? `bg-${p.color}-50 text-${p.color}-600 border-${p.color}-200` 
                            : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Cor da Meta
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {GOAL_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (editingGoal ? 'Salvar Alterações' : 'Criar Meta')}
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
