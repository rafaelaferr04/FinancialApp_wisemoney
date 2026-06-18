import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, subDays, subWeeks, subYears } from 'date-fns';
import { pt } from 'date-fns/locale';
import { usePlan } from '@/lib/PlanContext';
import { useNavigate } from 'react-router-dom';

function LockedChart({ locked, children }) {
  const navigate = useNavigate();
  if (!locked) return children;
  return (
    <div className="relative h-44">
      <div className="h-44 blur-[3px] pointer-events-none select-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-11 h-11 rounded-full bg-blue-700 flex items-center justify-center shadow-lg">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <p className="text-xs font-semibold text-slate-700">Bloqueado no Teste Gratuito</p>
        <button onClick={() => navigate('/PlanSelection')}
          className="mt-1 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-full transition-colors">
          Ver planos
        </button>
      </div>
    </div>
  );
}

const COLORS = ['#1d4ed8', '#3b82f6', '#06b6d4', '#ec4899', '#10b981', '#f97316', '#8b5cf6', '#ef4444'];

const categoryLabels = {
  salary: 'Salário', freelance: 'Freelance', investment: 'Investimento', gift: 'Presente',
  food: 'Alimentação', transport: 'Transporte', housing: 'Habitação', utilities: 'Contas',
  entertainment: 'Lazer', shopping: 'Compras', health: 'Saúde', education: 'Educação',
  savings: 'Poupança', other: 'Outros'
};

// Safe date string for filtering: avoids timezone issues by comparing YYYY-MM-DD strings directly
const toDateStr = (date) => format(date, 'yyyy-MM-dd');

export default function Statistics() {
  const [period, setPeriod] = useState('month');
  const [user, setUser] = useState(null);
  const { isFreeTrial } = usePlan();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => user ? base44.entities.Transaction.filter({ created_by: user.email }, '-created_date', 1000) : [],
    enabled: !!user
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: () => user ? base44.entities.SavingsGoal.filter({ created_by: user.email }) : [],
    enabled: !!user
  });

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (period) {
      case 'week':    return { startStr: toDateStr(subDays(now, 6)),      endStr: toDateStr(now) };
      case 'month':   return { startStr: toDateStr(startOfMonth(now)),     endStr: toDateStr(now) };
      case 'quarter': return { startStr: toDateStr(subMonths(now, 3)),     endStr: toDateStr(now) };
      case 'year':    return { startStr: toDateStr(subYears(now, 1)),      endStr: toDateStr(now) };
      case 'all':     return { startStr: '2000-01-01',                     endStr: toDateStr(now) };
      default:        return { startStr: toDateStr(startOfMonth(now)),     endStr: toDateStr(now) };
    }
  }, [period]);

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    const { startStr, endStr } = getDateRange();
    return transactions.filter(t => t.date && t.date >= startStr && t.date <= endStr);
  }, [transactions, getDateRange]);

  const filteredGoals = useMemo(() => {
    if (!goals.length) return [];
    if (period === 'all') return goals;
    const { startStr, endStr } = getDateRange();
    return goals.filter(g => !g.completed_date || (g.completed_date >= startStr && g.completed_date <= endStr));
  }, [goals, period, getDateRange]);

  const expenses      = filteredTransactions.filter(t => t.type === 'expense');
  const income        = filteredTransactions.filter(t => t.type === 'income');
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome   = income.reduce((s, t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  const expensesByCategory = expenses.reduce((acc, t) => { const c = t.category || 'other'; acc[c] = (acc[c] || 0) + t.amount; return acc; }, {});
  const pieChartData = Object.entries(expensesByCategory).map(([c, v]) => ({ name: categoryLabels[c] || c, value: v, category: c })).sort((a, b) => b.value - a.value);

  const incomeByCategory = income.reduce((acc, t) => { const c = t.category || 'other'; acc[c] = (acc[c] || 0) + t.amount; return acc; }, {});
  const incomePieData = Object.entries(incomeByCategory).map(([c, v]) => ({ name: categoryLabels[c] || c, value: v, category: c })).sort((a, b) => b.value - a.value);

  // Build array of date strings for the chart axes
  const buildDayRange = (startDate, endDate, step = 1) => {
    const days = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      days.push(toDateStr(cur));
      cur.setDate(cur.getDate() + step);
    }
    return days;
  };

  const getTimeChartData = () => {
    const now = new Date();
    if (period === 'week') {
      return buildDayRange(subDays(now, 6), now).map(ds => {
        const tx = transactions.filter(t => t.date === ds);
        return { name: format(new Date(ds + 'T12:00:00'), 'EEE', { locale: pt }), receitas: tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), despesas: tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
      });
    } else if (period === 'month') {
      const daysToShow = now.getDate();
      const step = Math.max(1, Math.ceil(daysToShow / 8));
      const data = [];
      for (let day = 1; day <= daysToShow; day += step) {
        const rangeEnd = Math.min(day + step - 1, daysToShow);
        let receitas = 0, despesas = 0;
        for (let d = day; d <= rangeEnd; d++) {
          const ds = toDateStr(new Date(now.getFullYear(), now.getMonth(), d));
          transactions.filter(t => t.date === ds).forEach(t => { t.type === 'income' ? (receitas += t.amount) : (despesas += t.amount); });
        }
        data.push({ name: format(new Date(now.getFullYear(), now.getMonth(), day), 'dd/MM'), receitas, despesas });
      }
      return data;
    } else {
      const months = period === 'quarter' ? 3 : period === 'year' ? 12 : 24;
      return Array.from({ length: months }, (_, i) => {
        const date = subMonths(now, months - 1 - i);
        const s = toDateStr(startOfMonth(date)), e = toDateStr(endOfMonth(date));
        const tx = transactions.filter(t => t.date && t.date >= s && t.date <= e);
        return { name: format(date, 'MMM', { locale: pt }), receitas: tx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), despesas: tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) };
      });
    }
  };

  const getSpendingTrend = () => {
    const now = new Date();
    if (period === 'week') {
      return buildDayRange(subDays(now, 6), now).map(ds => ({
        name: format(new Date(ds + 'T12:00:00'), 'EEE', { locale: pt }),
        value: transactions.filter(t => t.type === 'expense' && t.date === ds).reduce((s, t) => s + t.amount, 0)
      }));
    } else if (period === 'month') {
      const daysToShow = now.getDate();
      const step = Math.max(1, Math.ceil(daysToShow / 8));
      const data = [];
      for (let day = 1; day <= daysToShow; day += step) {
        const rangeEnd = Math.min(day + step - 1, daysToShow);
        let value = 0;
        for (let d = day; d <= rangeEnd; d++) {
          const ds = toDateStr(new Date(now.getFullYear(), now.getMonth(), d));
          value += transactions.filter(t => t.type === 'expense' && t.date === ds).reduce((s, t) => s + t.amount, 0);
        }
        data.push({ name: format(new Date(now.getFullYear(), now.getMonth(), day), 'dd/MM'), value });
      }
      return data;
    } else if (period === 'quarter') {
      return Array.from({ length: 12 }, (_, i) => {
        const we = subWeeks(now, 11 - i);
        const ws = subDays(we, 6);
        const s = toDateStr(ws), e = toDateStr(we);
        return { name: format(we, 'dd/MM'), value: transactions.filter(t => t.type === 'expense' && t.date && t.date >= s && t.date <= e).reduce((s, t) => s + t.amount, 0) };
      });
    } else {
      const months = period === 'year' ? 12 : 24;
      return Array.from({ length: months }, (_, i) => {
        const date = subMonths(now, months - 1 - i);
        const s = toDateStr(startOfMonth(date)), e = toDateStr(endOfMonth(date));
        return { name: format(date, 'MMM', { locale: pt }), value: transactions.filter(t => t.type === 'expense' && t.date && t.date >= s && t.date <= e).reduce((sum, t) => sum + t.amount, 0) };
      });
    }
  };

  const getBalanceEvolution = () => {
    const now = new Date();
    const sortedTx = [...transactions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const balUpTo = (ds) => sortedTx.filter(t => t.date && t.date <= ds).reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    if (period === 'week') {
      return buildDayRange(subDays(now, 6), now).map(ds => ({
        name: format(new Date(ds + 'T12:00:00'), 'EEE', { locale: pt }),
        saldo: balUpTo(ds)
      }));
    } else if (period === 'month') {
      const daysToShow = now.getDate();
      const step = Math.max(1, Math.ceil(daysToShow / 8));
      const data = [];
      for (let day = 1; day <= daysToShow; day += step) {
        const ds = toDateStr(new Date(now.getFullYear(), now.getMonth(), day));
        data.push({ name: format(new Date(now.getFullYear(), now.getMonth(), day), 'dd/MM'), saldo: balUpTo(ds) });
      }
      return data;
    } else {
      const months = period === 'quarter' ? 3 : period === 'year' ? 12 : 24;
      return Array.from({ length: months }, (_, i) => {
        const date = subMonths(now, months - 1 - i);
        const e = toDateStr(endOfMonth(date));
        return { name: format(date, 'MMM', { locale: pt }), saldo: balUpTo(e) };
      });
    }
  };

  const avgDailySpending = expenses.length > 0 ? totalExpenses / Math.max(1, new Set(expenses.map(e => e.date)).size) : 0;
  const topExpenses      = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const timeChartData    = getTimeChartData();
  const spendingTrend    = getSpendingTrend();
  const balanceEvolution = getBalanceEvolution();

  const periodFilters = [
    { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mês' },
    { id: 'quarter', label: 'Trimestre' }, { id: 'year', label: 'Ano' }, { id: 'all', label: 'Sempre' }
  ];

  return (
    <div className="space-y-4">

      {/* Hero banner */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 py-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest">Análise</p>
                <h1 className="text-white text-lg sm:text-xl font-bold leading-tight">Estatísticas</h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Receitas',      value: `€${totalIncome.toLocaleString('pt-PT')}`,     color: 'text-emerald-300' },
                { label: 'Despesas',      value: `€${totalExpenses.toLocaleString('pt-PT')}`,   color: 'text-rose-300' },
                { label: 'Saldo',         value: `€${Math.abs(balance).toLocaleString('pt-PT')}${balance < 0 ? ' neg.' : ''}`, color: balance >= 0 ? 'text-sky-200' : 'text-rose-300' },
                { label: 'Taxa Poupança', value: `${savingsRate.toFixed(0)}%`,                  color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm">
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                  <p className="text-blue-200 text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Period filter — compact, no scroll */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 py-2">
        <div className="flex gap-1.5">
          {periodFilters.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${period === p.id ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Avg daily spending */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between shadow-md">
        <div>
          <p className="text-sm text-blue-100">Gasto Médio Diário</p>
          <p className="text-xs text-blue-200">{{ week: 'Semana', month: 'Mês', quarter: 'Trimestre', year: 'Ano', all: 'Sempre' }[period]}</p>
        </div>
        <p className="text-3xl font-bold">€{avgDailySpending.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</p>
      </motion.div>

      {/* Row 1: Spending Trend + Balance Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-rose-500" /><h3 className="font-semibold text-slate-800 text-sm">Tendência de Gastos</h3></div>
          <LockedChart locked={isFreeTrial}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}`} width={50} />
                  <Tooltip formatter={(value) => [`€${value.toLocaleString('pt-PT')}`, 'Gastos']} />
                  <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LockedChart>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-blue-700" /><h3 className="font-semibold text-slate-800 text-sm">Evolução do Saldo</h3></div>
          <LockedChart locked={isFreeTrial}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}`} width={50} />
                  <Tooltip formatter={(value) => [`€${value.toLocaleString('pt-PT')}`, 'Saldo']} />
                  <Line type="monotone" dataKey="saldo" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </LockedChart>
        </motion.div>
      </div>

      {/* Row 2: Receitas vs Despesas + Expenses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-blue-500" /><h3 className="font-semibold text-slate-800 text-sm">Receitas vs Despesas</h3></div>
          <LockedChart locked={isFreeTrial}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}`} width={50} />
                  <Tooltip formatter={(value) => [`€${value.toLocaleString('pt-PT')}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LockedChart>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-indigo-500" /><h3 className="font-semibold text-slate-800 text-sm">Despesas por Categoria</h3></div>
          {isFreeTrial ? (
            <LockedChart locked={true}><div className="h-44" /></LockedChart>
          ) : pieChartData.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie><Pie data={pieChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} dataKey="value">{pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {pieChartData.slice(0, 5).map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-xs text-slate-600 truncate">{item.name}</span></div>
                    <span className="text-xs font-medium text-slate-800 shrink-0">€{item.value.toLocaleString('pt-PT')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-center text-slate-500 py-6 text-sm">Sem despesas</p>}
        </motion.div>

      </div>

      {/* Row 3: Income by Category + Maiores Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {incomePieData.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-emerald-500" /><h3 className="font-semibold text-slate-800 text-sm">Receitas por Categoria</h3></div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie><Pie data={incomePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} dataKey="value">{incomePieData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}</Pie></RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {incomePieData.slice(0, 4).map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} /><span className="text-xs text-slate-600 truncate">{item.name}</span></div>
                    <span className="text-xs font-medium text-slate-800 shrink-0">€{item.value.toLocaleString('pt-PT')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : <div />}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-amber-500" /><h3 className="font-semibold text-slate-800 text-sm">Maiores Despesas</h3></div>
          {topExpenses.length > 0 ? (
            <div className="space-y-2.5">
              {topExpenses.map((expense, index) => (
                <div key={expense.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{expense.title}</p>
                    <p className="text-xs text-slate-400">{categoryLabels[expense.category] || expense.category}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800 shrink-0">€{expense.amount.toLocaleString('pt-PT')}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-slate-500 py-4 text-sm">Sem despesas</p>}
        </motion.div>
      </div>

      {/* Goals progress */}
      {filteredGoals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4"><div className="w-1 h-4 rounded-full bg-emerald-600" /><h3 className="font-semibold text-slate-800 text-sm">Progresso das Metas</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 truncate">{goal.icon || '🎯'} {goal.title}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>€{goal.current_amount?.toLocaleString('pt-PT')}</span>
                    <span>€{goal.target_amount?.toLocaleString('pt-PT')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
