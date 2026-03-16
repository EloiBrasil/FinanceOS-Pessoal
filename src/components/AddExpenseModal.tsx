import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Calendar, AlignLeft, Tag } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  categories: Category[];
  initialType?: 'expense' | 'income';
  editingExpense?: {
    id: string;
    description: string;
    amount: number;
    category_id: string | null;
    type: 'expense' | 'income';
    date: string;
    notes: string | null;
  } | null;
}

export default function AddExpenseModal({ open, onClose, onSuccess, userId, categories, initialType = 'expense', editingExpense }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setDescription(editingExpense.description);
        setAmount(editingExpense.amount.toString());
        setCategoryId(editingExpense.category_id || '');
        setType(editingExpense.type);
        setDate(editingExpense.date);
        setNotes(editingExpense.notes || '');
      } else {
        setDescription(''); setAmount(''); setCategoryId('');
        setType(initialType); setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
      setError(null);
    }
  }, [open, editingExpense, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const finalDescription = type === 'income' ? (description.trim() || 'Receita') : description.trim();
    
    if (type === 'expense' && !categoryId) {
      setError('Por favor, selecione uma categoria para a despesa.');
      return;
    }

    if (!finalDescription || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(type === 'income' ? 'Insira um valor válido.' : 'Preencha descrição e um valor válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const expenseData = {
        user_id: userId,
        description: finalDescription,
        amount: parsedAmount,
        category_id: type === 'income' ? null : (categoryId || null),
        type,
        date,
        notes: type === 'income' ? null : (notes.trim() || null),
      };

      let res;
      if (editingExpense) {
        res = await supabase.from('expenses').update(expenseData).eq('id', editingExpense.id);
      } else {
        res = await supabase.from('expenses').insert(expenseData);
      }

      if (res.error) throw res.error;
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Erro ao salvar. Tente novamente.');
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
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-lg font-bold text-slate-800">
                  {editingExpense ? 'Editar Registro' : 'Nova Despesa / Receita'}
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      type === 'expense'
                        ? 'bg-white shadow-sm text-rose-500'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    💸 Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      type === 'income'
                        ? 'bg-white shadow-sm text-emerald-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    💰 Receita
                  </button>
                </div>

                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descrição</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        autoFocus
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="ex: Supermercado, Farmácia..."
                        required
                        maxLength={80}
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1773cf] transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    {type === 'income' ? 'Valor da Receita (R$)' : 'Valor da Despesa (R$)'}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        autoFocus={type === 'income'}
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                      placeholder="0,00"
                      required
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1773cf] transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1773cf] transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      <Tag className="w-3.5 h-3.5 inline mr-1" />
                      Categoria
                    </label>
                    {categories.length === 0 ? (
                      <p className="text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-3 border border-rose-100 font-medium">
                        Você precisa criar pelo menos uma categoria antes de registrar despesas!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryId(cat.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                            style={
                              categoryId === cat.id
                                ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                                : { backgroundColor: `${cat.color}12`, color: cat.color, borderColor: `${cat.color}30` }
                            }
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Observações <span className="font-normal text-slate-400">(opcional)</span></label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Algum detalhe extra..."
                      rows={2}
                      maxLength={200}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1773cf] transition-all bg-slate-50/50 resize-none"
                    />
                  </div>
                )}

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
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 ${
                      type === 'income'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-[#1773cf] hover:bg-[#1460b0]'
                    }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (editingExpense ? 'Salvar Alterações' : (type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'))}
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
