/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import AuthPage from './components/AuthPage';
import AddCategoryModal from './components/AddCategoryModal';
import AddExpenseModal from './components/AddExpenseModal';
import AddGoalModal from './components/AddGoalModal';
import AddContributionModal from './components/AddContributionModal';
import GoalPredictionModal from './components/GoalPredictionModal';
import SetSavingsGoalModal from './components/SetSavingsGoalModal';
import { 
  LayoutDashboard, 
  Target, 
  ReceiptText, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShoppingCart, 
  PiggyBank, 
  Calendar, 
  Plane, 
  Car, 
  Home, 
  Bell, 
  Download,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  User,
  LogOut,
  Tag,
  Calculator,
  Edit2,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type View = 'dashboard' | 'goals' | 'transactions' | 'analytics';

interface Transaction {
  id: string;
  establishment: string;
  category: string;
  date: string;
  month: string;
  value: number;
  type: 'expense' | 'income';
  icon: React.ReactNode;
}

interface Goal {
  id: string;
  title: string;
  deadline: string;
  total: number;
  saved: number;
  monthlyContribution: number;
  icon: React.ReactNode;
  color: string;
  priority: 'urgente' | 'breve' | 'longo';
}

interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

interface DBCategory {
  id: string;
  name: string;
  color: string;
}

interface DBExpense {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  notes: string | null;
  category_id: string | null;
  categories: { name: string; color: string } | null;
}

interface DBGoal {
  id: string;
  title: string;
  total: number;
  saved: number;
  monthly_contribution: number;
  deadline: string;
  icon: string;
  color: string;
  priority: 'urgente' | 'breve' | 'longo';
}

// --- Mock Data (Esvaziados para produção) ---

const MOCK_TRANSACTIONS: Transaction[] = [];
const MOCK_GOALS: Goal[] = [];
const CATEGORY_DATA: CategorySpending[] = [];
const EVOLUTION_DATA: any[] = [];

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string; key?: any }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const StatCard = ({ title, value, trend, icon: Icon, colorClass, action }: { title: string; value: string; trend?: string; icon: any; colorClass: string; action?: React.ReactNode }) => (
  <Card className="p-6">
    <div className="flex justify-between items-start mb-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <div className="flex items-center gap-2">
        {action}
        <div className={cn("p-2 rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    {trend && (
      <div className="flex items-center gap-1 mt-2">
        <TrendingUp className="w-3 h-3 text-emerald-500" />
        <p className="text-emerald-500 text-xs font-bold">{trend}</p>
      </div>
    )}
  </Card>
);

interface GoalItemProps {
  key?: any;
  goal: Goal;
  onContribution: () => void;
  onPriorityChange: (id: string, p: 'urgente' | 'breve' | 'longo') => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const GoalItem = ({ goal, onContribution, onPriorityChange, onEdit, onDelete }: GoalItemProps) => {
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  
  const priorityInfo = {
    urgente: { label: 'Urgente', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600' },
    breve: { label: 'Em breve', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
    longo: { label: 'Longo prazo', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' }
  }[goal.priority];

  const progress = (goal.saved / goal.total) * 100;
  
  return (
    <>
      <Card className={cn("mb-4 relative overflow-hidden", goal.priority === 'urgente' && "border-rose-200 shadow-md")}>
        {goal.priority === 'urgente' && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
             <div className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", priorityInfo.bg, priorityInfo.text)}>
                {priorityInfo.label}
             </div>
             
             <div className="flex gap-1">
                {(['urgente', 'breve', 'longo'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => onPriorityChange(goal.id, p)}
                    className={cn(
                      "w-4 h-4 rounded-full border border-white shadow-sm transition-all",
                      p === 'urgente' && "bg-rose-500",
                      p === 'breve' && "bg-amber-500",
                      p === 'longo' && "bg-emerald-500",
                      goal.priority === p ? "scale-125 ring-2 ring-slate-200" : "opacity-30 hover:opacity-70"
                    )}
                    title={`Mudar para ${p}`}
                  />
                ))}
             </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-600" style={{ color: goal.color, backgroundColor: `${goal.color}15` }}>
                {goal.icon}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                <p className="text-sm text-slate-500">Prazo: {goal.deadline}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 lg:max-w-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total da Meta</span>
                <span className="text-lg font-bold text-slate-900">R$ {goal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Já Poupado</span>
                <span className="text-lg font-bold text-emerald-600">R$ {goal.saved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex flex-col col-span-2 md:col-span-1">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Aporte Mensal</span>
                <span className="text-lg font-black text-primary">R$ {goal.monthlyContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2 text-sm font-bold">
              <span className="text-slate-500">Progresso</span>
              <span style={{ color: goal.color }}>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full" 
                style={{ backgroundColor: goal.color }}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
          <button 
            onClick={() => setShowAddContribution(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors uppercase tracking-widest"
          >
            <Plus className="w-3 h-3" />
            Adicionar Aporte
          </button>
          <button 
            onClick={() => setShowPrediction(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors uppercase tracking-widest"
          >
            <Calculator className="w-3 h-3" />
            Previsão
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
                onDelete(goal.id);
              }
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Excluir
          </button>
          <button 
            onClick={() => onEdit(goal)}
            className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
          >
            Editar
          </button>
        </div>
      </Card>

      <AddContributionModal
        open={showAddContribution}
        onClose={() => setShowAddContribution(false)}
        onSuccess={onContribution}
        goalId={goal.id}
        goalTitle={goal.title}
        currentSaved={goal.saved}
      />

      <GoalPredictionModal
        open={showPrediction}
        onClose={() => setShowPrediction(false)}
        goalTitle={goal.title}
        total={goal.total}
        saved={goal.saved}
      />
    </>
  );
};

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [currentView, setCurrentView] = useState<View>('transactions');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  // Supabase data
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [dbExpenses, setDbExpenses] = useState<DBExpense[]>([]);
  const [dbGoals, setDbGoals] = useState<DBGoal[]>([]);

  // Modal state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingExpense, setEditingExpense] = useState<DBExpense | null>(null);
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [expenseModalType, setExpenseModalType] = useState<'expense' | 'income'>('expense');
  const [evolutionView, setEvolutionView] = useState<'weekly' | 'monthly'>('weekly');
  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const saved = localStorage.getItem('savings_goal');
    return saved ? Number(saved) : 1000;
  });
  const [showSetSavingsGoal, setShowSetSavingsGoal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load categories and expenses when authenticated
  useEffect(() => {
    if (!session) return;
    loadCategories();
    loadExpenses();
    loadGoals();
  }, [session]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, color')
      .order('created_at', { ascending: true });
    if (data) setDbCategories(data);
  };

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('id, description, amount, type, date, notes, category_id, categories(name, color)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setDbExpenses(data as unknown as DBExpense[]);
  };

  const loadGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*');
    
    if (data) {
      const priorityOrder = { urgente: 0, breve: 1, longo: 2 };
      const sorted = (data as unknown as DBGoal[]).sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      setDbGoals(sorted);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) loadExpenses();
  };

  const handleDeleteCategory = async (cat: DBCategory) => {
    if (!window.confirm(`Isso excluirá a categoria "${cat.name}". Transações vinculadas poderão ficar sem categoria. Continuar?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (!error) {
      setDbCategories(prev => prev.filter(c => c.id !== cat.id));
      loadExpenses();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) loadGoals();
  };

  const handlePriorityChange = async (goalId: string, newPriority: 'urgente' | 'breve' | 'longo') => {
    const { error } = await supabase
      .from('goals')
      .update({ priority: newPriority })
      .eq('id', goalId);
    
    if (!error) loadGoals();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const months = useMemo(() => {
    return [
      'Todos', 
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  }, []);

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'Todos') return MOCK_TRANSACTIONS;
    return MOCK_TRANSACTIONS.filter(t => t.month === selectedMonth);
  }, [selectedMonth]);

  // Categorias Reais (DB)
  const allCategories = useMemo(() => {
    return dbCategories.map(c => ({ id: c.id, name: c.name, color: c.color }));
  }, [dbCategories]);

  // Transações Reais (DB)
  const unifiedDisplayTransactions = useMemo(() => {
    const dbItems = dbExpenses.map(exp => ({
      id: exp.id,
      establishment: exp.description,
      category: exp.categories?.name || 'Sem categoria',
      date: new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      month: new Date(exp.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'long' }),
      value: Number(exp.amount),
      type: exp.type as 'expense' | 'income',
      icon: exp.type === 'income' ? <Wallet className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />,
      isDB: true
    }));

    const currentMonthLabel = selectedMonth.toLowerCase();
    const filteredByMonth = selectedMonth === 'Todos' 
      ? dbItems 
      : dbItems.filter(item => item.month.toLowerCase().includes(currentMonthLabel));

    // A listagem principal mostra apenas despesas agora
    return filteredByMonth.filter(t => t.type === 'expense');
  }, [dbExpenses, selectedMonth]);

  const totalBalance = useMemo(() => {
    const allDbItems = dbExpenses.map(exp => ({
      value: Number(exp.amount),
      type: exp.type
    }));
    return allDbItems
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.value, 0) - 
      allDbItems
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.value, 0);
  }, [dbExpenses]);

  const monthlySpending = useMemo(() => {
    return unifiedDisplayTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.value, 0);
  }, [unifiedDisplayTransactions]);

  const savings = useMemo(() => {
    // Economia real é o que sobrou (Renda - Gastos) no período selecionado ou total
    return totalBalance > 0 ? totalBalance : 0;
  }, [totalBalance]);

  const savingsPercentage = useMemo(() => {
    if (savingsGoal <= 0) return 0;
    return Math.min(100, (savings / savingsGoal) * 100);
  }, [savings, savingsGoal]);

  const goalsSummary = useMemo(() => {
    const totalSaved = dbGoals.reduce((acc, g) => acc + Number(g.saved), 0);
    const totalTarget = dbGoals.reduce((acc, g) => acc + Number(g.total), 0);
    const remaining = Math.max(0, totalTarget - totalSaved);
    const recommended = remaining / 24;
    return {
      saved: totalSaved,
      target: totalTarget,
      recommended: recommended,
      progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    };
  }, [dbGoals]);

  // Dados reais para o Dashboard
  const dashboardCategoryData = useMemo(() => {
    const categoriesMap: Record<string, { value: number; color: string }> = {};
    
    dbExpenses.filter(e => e.type === 'expense').forEach(exp => {
      const catName = exp.categories?.name || 'Sem categoria';
      const catColor = exp.categories?.color || '#cbd5e1';
      
      if (!categoriesMap[catName]) {
        categoriesMap[catName] = { value: 0, color: catColor };
      }
      categoriesMap[catName].value += Number(exp.amount);
    });

    return Object.entries(categoriesMap).map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color
    })).sort((a, b) => b.value - a.value);
  }, [dbExpenses]);

  const dashboardEvolutionData = useMemo(() => {
    const data: { name: string; real: number; predicted: number }[] = [];
    const now = new Date();
    
    if (evolutionView === 'weekly') {
      // Agrupa por semana (últimas 4 semanas)
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7 + 7));
        const end = new Date();
        end.setDate(now.getDate() - (i * 7));
        
        const sum = dbExpenses
          .filter(e => e.type === 'expense')
          .filter(e => {
            const d = new Date(e.date + 'T12:00:00');
            return d >= start && d <= end;
          })
          .reduce((acc, e) => acc + Number(e.amount), 0);

        data.push({
          name: `S-${3-i+1}`,
          real: sum,
          predicted: monthlySpending / 4
        });
      }
    } else {
      // Agrupa por mês (últimos 6 meses)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        
        const sum = dbExpenses
          .filter(e => e.type === 'expense')
          .filter(e => {
            const expDate = new Date(e.date + 'T12:00:00');
            return expDate.getMonth() === d.getMonth() && expDate.getFullYear() === d.getFullYear();
          })
          .reduce((acc, e) => acc + Number(e.amount), 0);

        data.push({
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          real: sum,
          predicted: monthlySpending // Simplificação para o mensal
        });
      }
    }
    return data;
  }, [dbExpenses, monthlySpending, evolutionView]);

  const recentTransactions = useMemo(() => {
    return [...dbExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(exp => ({
        id: exp.id,
        establishment: exp.description,
        category: exp.categories?.name || 'Sem categoria',
        date: new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        value: Number(exp.amount),
        type: exp.type as 'expense' | 'income',
        icon: exp.type === 'income' ? <Wallet className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />
      }));
  }, [dbExpenses]);

  // Still loading session
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1773cf]/30 border-t-[#1773cf] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 lg:px-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinanceOS</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{session.user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400">{session.user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 lg:px-20">
        
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              currentView === 'dashboard' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('goals')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              currentView === 'goals' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Target className="w-4 h-4" />
            Metas
          </button>
          <button 
            onClick={() => setCurrentView('transactions')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              currentView === 'transactions' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ReceiptText className="w-4 h-4" />
            Controle de gastos
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Saldo Total" 
                  value={`R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+2.4% este mês"
                  icon={Wallet}
                  colorClass="bg-primary/10 text-primary"
                />
                <StatCard 
                  title="Gastos no Mês" 
                  value={`R$ ${monthlySpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="-12% vs mês anterior"
                  icon={ShoppingCart}
                  colorClass="bg-rose-50 text-rose-500"
                />
                <StatCard 
                  title="Economia" 
                  value={`R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend={`${savingsPercentage.toFixed(0)}% da meta atingida`}
                  icon={PiggyBank}
                  colorClass="bg-amber-50 text-amber-500"
                  action={
                    <button 
                      onClick={() => setShowSetSavingsGoal(true)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-md transition-all"
                      title="Definir Meta"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  }
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Categories Pie Chart */}
                <Card className="lg:col-span-4 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Gastos por Categoria</h3>
                    <button 
                      onClick={() => setCurrentView('analytics')}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      Ver Tudo
                    </button>
                  </div>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardCategoryData.length > 0 ? dashboardCategoryData : [{ name: 'Vazio', value: 1, color: '#f1f5f9' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(dashboardCategoryData.length > 0 ? dashboardCategoryData : [{ color: '#f1f5f9' }]).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold">R$ {monthlySpending.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {dashboardCategoryData.slice(0, 4).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-ellipsis overflow-hidden whitespace-nowrap">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-sm font-medium text-slate-600 truncate">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold flex-shrink-0 ml-2">R$ {cat.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Evolution Bar Chart */}
                <Card className="lg:col-span-8 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Evolução de Gastos</h3>
                      <p className="text-sm text-slate-400">Comparativo das últimas 4 semanas</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setEvolutionView('weekly')}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded transition-all",
                          evolutionView === 'weekly' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Semanal
                      </button>
                      <button 
                        onClick={() => setEvolutionView('monthly')}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded transition-all",
                          evolutionView === 'monthly' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Mensal
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="real" name="Gasto Real" fill="#1773cf" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="predicted" name="Média Esperada" fill="#1773cf20" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-2 rounded-full bg-primary"></div>
                      <span className="text-xs font-bold text-slate-400">Gastos Reais</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-2 rounded-full bg-primary/20"></div>
                      <span className="text-xs font-bold text-slate-400">Média Prevista</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Transactions Table */}
              <Card>
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                  <h3 className="text-lg font-bold">Transações Recentes</h3>
                  <button className="text-primary text-sm font-bold hover:underline">Ver extrato completo</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estabelecimento</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                            Nenhuma transação recente encontrada.
                          </td>
                        </tr>
                      ) : (
                        recentTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  {t.icon}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{t.establishment}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-medium">{t.date}</td>
                            <td className={cn(
                              "px-6 py-4 text-sm font-bold text-right",
                              t.type === 'income' ? "text-emerald-600" : "text-slate-900"
                            )}>
                              {t.type === 'income' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {currentView === 'goals' && (
            <motion.div 
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight mb-2">Meus Objetivos</h1>
                  <p className="text-slate-500">Acompanhe seu progresso e planeje seu futuro financeiro.</p>
                </div>
                <button 
                  onClick={() => setShowAddGoal(true)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Nova Meta
                </button>
              </div>

              {/* Goals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <PiggyBank className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Poupado</span>
                  </div>
                  <h3 className="text-2xl font-bold">R$ {goalsSummary.saved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <div className="flex items-center gap-1 mt-2 text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-bold">Nas suas metas</span>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Meta Global</span>
                  </div>
                  <h3 className="text-2xl font-bold">R$ {goalsSummary.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${goalsSummary.progress}%` }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                </Card>
                <Card className="p-6 bg-primary text-white border-none shadow-xl shadow-primary/10">
                  <div className="flex items-center gap-2 opacity-70 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Aporte Mensal Recomendado</span>
                  </div>
                  <h3 className="text-3xl font-black">R$ {goalsSummary.recommended.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-[10px] opacity-80 mt-2">Sugestão para atingir todas as metas em um prazo de 2 anos.</p>
                </Card>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                  Detalhamento das Metas
                </h2>
                {dbGoals.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Nenhuma meta ainda</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Crie um objetivo para começar a poupar.
                    </p>
                  </div>
                ) : (
                  dbGoals.map(goal => (
                    <GoalItem 
                      key={goal.id} 
                      onContribution={loadGoals}
                      onPriorityChange={handlePriorityChange}
                      onEdit={(g) => {
                        setEditingGoal(g);
                        setShowAddGoal(true);
                      }}
                      onDelete={handleDeleteGoal}
                      goal={{
                        ...goal,
                        monthlyContribution: goal.monthly_contribution,
                        icon: <Target className="w-6 h-6" />
                      }} 
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="text-primary text-xs font-bold mb-2 flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
                  >
                    ← Voltar para Dashboard
                  </button>
                  <h1 className="text-2xl font-bold">Análise por Categoria</h1>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gasto Total Analisado</p>
                  <p className="text-xl font-black text-slate-800">R$ {monthlySpending.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCategoryData.map((cat) => {
                  const percentage = monthlySpending > 0 ? ((cat.value / monthlySpending) * 100).toFixed(1) : '0';
                  const itemsInCategory = dbExpenses
                    .filter(e => e.type === 'expense' && (e.categories?.name || 'Sem categoria') === cat.name)
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3);

                  return (
                    <Card key={cat.name} className="p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all border-slate-100">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <h3 className="font-bold text-slate-800">{cat.name}</h3>
                        </div>
                        <span className="text-lg font-black text-slate-900">R$ {cat.value.toLocaleString('pt-BR')}</span>
                      </div>

                      <div className="flex items-center gap-6 mb-6">
                        <div className="h-24 w-24 flex-shrink-0 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { value: cat.value },
                                  { value: Math.max(0, monthlySpending - cat.value) }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={40}
                                stroke="none"
                                dataKey="value"
                              >
                                <Cell fill={cat.color} />
                                <Cell fill={`${cat.color}15`} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold" style={{ color: cat.color }}>{percentage}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Representatividade</p>
                          <p className="text-sm font-medium text-slate-600">Este grupo consome {percentage}% do seu gasto mensal.</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Maiores Gastos</p>
                        {itemsInCategory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg">
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{item.description}</span>
                            <span className="text-xs font-black text-slate-800">R$ {Number(item.amount).toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentView === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-bold">Controle Financeiro</h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      {months.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar transação..." 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Esquerda: Receita Atual */}
                <div className="lg:col-span-3 space-y-6">
                  <Card className="p-6 bg-emerald-50/30 border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-4">
                      <Wallet className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Receita Atual</span>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Total {selectedMonth === 'Todos' ? 'Geral' : `em ${selectedMonth}`}</p>
                      <h3 className="text-2xl font-black text-emerald-600">
                        R$ {dbExpenses
                          .filter(exp => {
                            if (exp.type !== 'income') return false;
                            if (selectedMonth === 'Todos') return true;
                            const month = new Date(exp.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'long' });
                            return month.toLowerCase().includes(selectedMonth.toLowerCase());
                          })
                          .reduce((acc, exp) => acc + Number(exp.amount), 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    <button 
                      onClick={() => {
                        setExpenseModalType('income');
                        setShowAddExpense(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar receita
                    </button>
                    
                    <p className="text-[10px] text-emerald-600/60 mt-4 text-center italic">
                      Lançamentos de rendas, salários e bônus.
                    </p>
                  </Card>

                  <Card className="p-6 bg-rose-50/30 border-rose-100">
                    <div className="flex items-center gap-2 text-rose-500 mb-4">
                      <TrendingDown className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Total Despesas</span>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Gasto {selectedMonth === 'Todos' ? 'Geral' : `em ${selectedMonth}`}</p>
                      <h3 className="text-2xl font-black text-rose-500">
                        R$ {dbExpenses
                          .filter(exp => {
                            if (exp.type !== 'expense') return false;
                            if (selectedMonth === 'Todos') return true;
                            const month = new Date(exp.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'long' });
                            return month.toLowerCase().includes(selectedMonth.toLowerCase());
                          })
                          .reduce((acc, exp) => acc + Number(exp.amount), 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </Card>

                  {/* Dica ou Info Extra na sidebar */}
                  <div className="p-6 rounded-2xl bg-slate-900 text-white overflow-hidden relative group">
                    <div className="relative z-10">
                      <p className="text-white/60 text-[10px] font-bold uppercase mb-2">Dica Financeira</p>
                      <p className="text-xs font-medium leading-relaxed">
                        Tente manter seus gastos fixos em até 50% da sua receita atual.
                      </p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 bg-white/10 w-20 h-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  </div>
                </div>

                {/* Lista de Transações (Agrupada por Categorias) */}
                <div className="lg:col-span-9 space-y-6">
                  {allCategories.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Tag className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Comece seu controle</h3>
                    <p className="text-slate-400 text-sm max-w-[280px] mx-auto mt-1">
                      Crie sua primeira categoria (ex: Aluguel, Salário) para começar a registrar.
                    </p>
                  </div>
                ) : (
                  allCategories.map((cat) => {
                    const items = unifiedDisplayTransactions.filter(t => t.category === cat.name);
                    const total = items.reduce((acc, curr) => acc + curr.value, 0);
                    
                    return (
                      <Card key={cat.id}>
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <h3 className="font-bold text-slate-700">{cat.name}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-1 border-l border-slate-200 ml-1 pl-2">
                              <button 
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setShowAddCategory(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-md"
                                title="Editar Categoria"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors hover:bg-white rounded-md"
                                title="Excluir Categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setExpenseModalType('expense');
                                  setShowAddExpense(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors hover:bg-white rounded-md"
                                title="Novo lançamento"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {items.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-300 text-xs italic">
                              Nenhum registro nesta categoria ainda.
                            </div>
                          ) : (
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                  <th className="px-6 py-3">Data</th>
                                  <th className="px-6 py-3">Descrição</th>
                                  <th className="px-6 py-3 text-right">Valor</th>
                                  <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">{item.date}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{item.establishment}</td>
                                    <td className={cn(
                                      "px-6 py-4 text-right font-bold",
                                      item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                                    )}>
                                      {item.type === 'income' ? '+' : '-'} R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-1">
                                        <button 
                                          onClick={() => {
                                            const originalExpense = dbExpenses.find(e => e.id === item.id);
                                            if (originalExpense) {
                                              setEditingExpense(originalExpense);
                                              setShowAddExpense(true);
                                            }
                                          }}
                                          className="p-1.5 text-slate-300 hover:text-primary transition-colors rounded-md hover:bg-primary/5"
                                          title="Editar"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteExpense(item.id)}
                                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded-md hover:bg-rose-50"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 rounded-full font-bold text-primary hover:bg-slate-50 transition-all active:scale-95"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Adicionar Nova Categoria
                </button>
                <button
                  onClick={() => {
                    setExpenseModalType('expense');
                    setShowAddExpense(true);
                  }}
                  className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Nova Despesa
                </button>
              </div>
            </motion.div>
          )}
      <AddGoalModal 
        open={showAddGoal} 
        onClose={() => {
          setShowAddGoal(false);
          setEditingGoal(null);
        }} 
        onSuccess={loadGoals}
        userId={session.user.id}
        editingGoal={editingGoal}
      />
      <SetSavingsGoalModal
        open={showSetSavingsGoal}
        onClose={() => setShowSetSavingsGoal(false)}
        currentGoal={savingsGoal}
        onSuccess={(newGoal) => {
          setSavingsGoal(newGoal);
          localStorage.setItem('savings_goal', newGoal.toString());
        }}
      />
    </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-6 h-6 bg-slate-200 rounded-md"></div>
            <span className="text-sm font-bold italic">SmartSaver 2024</span>
          </div>
          
          <nav className="flex gap-8">
            {['Dashboard', 'Extrato', 'Investimentos', 'Perfil'].map((link) => (
              <a key={link} href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">{link}</a>
            ))}
          </nav>
          
          <p className="text-xs text-slate-400">© 2024 FinanceOS. Design Limpo & Profissional.</p>
        </div>
      </footer>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <AddCategoryModal
        open={showAddCategory}
        onClose={() => {
          setShowAddCategory(false);
          setEditingCategory(null);
        }}
        userId={session.user.id}
        onSuccess={(cat) => {
          if (editingCategory) {
            setDbCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
          } else {
            setDbCategories(prev => [...prev, cat]);
          }
          loadExpenses();
        }}
        editingCategory={editingCategory}
      />
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          setEditingExpense(null);
        }}
        userId={session.user.id}
        categories={dbCategories}
        onSuccess={() => loadExpenses()}
        editingExpense={editingExpense}
        initialType={expenseModalType}
      />
    </div>
  );
}
