import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tag, Palette, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PRESET_COLORS = [
  '#1773cf', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#06b6d4',
];

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (category: { id: string; name: string; color: string }) => void;
  userId: string;
  editingCategory?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export default function AddCategoryModal({ open, onClose, onSuccess, userId, editingCategory }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1773cf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setName(editingCategory.name);
        setColor(editingCategory.color);
      } else {
        setName('');
        setColor('#1773cf');
      }
      setError(null);
    }
  }, [open, editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (editingCategory) {
        res = await supabase
          .from('categories')
          .update({ name: name.trim(), color })
          .eq('id', editingCategory.id)
          .select()
          .single();
      } else {
        res = await supabase
          .from('categories')
          .insert({ user_id: userId, name: name.trim(), color })
          .select()
          .single();
      }

      if (res.error) throw res.error;
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError('Erro ao salvar categoria. Tente novamente.');
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <Tag className="w-4 h-4" style={{ color }} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome da categoria</label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ex: Alimentação, Lazer..."
                    required
                    maxLength={40}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1773cf] transition-all bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    <Palette className="w-3.5 h-3.5 inline mr-1" />
                    Cor
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </button>
                    ))}
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
                    disabled={loading || !name.trim()}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: color }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (editingCategory ? 'Salvar Alterações' : 'Criar Categoria')}
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
