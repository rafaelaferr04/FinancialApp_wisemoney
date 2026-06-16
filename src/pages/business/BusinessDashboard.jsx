import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, AlertTriangle, ArrowRight, Plus, Wallet, Building2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

function toDateStr(d) { return format(d, 'yyyy-MM-dd'); }

function calcKPICurrentValue(kpi, transactions, employees, monthStr) {
  switch (kpi.data_source) {
    case 'transactions_revenue':
      return transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(monthStr)).reduce((s, t) => s + (t.amount || 0), 0);
    case 'transactions_cost':
      return transactions.filter(t => ['cost', 'investment', 'tax'].includes(t.type) && t.date?.startsWith(monthStr)).reduce((s, t) => s + (t.amount || 0), 0);
    case 'gross_margin_pct': {
      const rev = transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(monthStr)).reduce((s, t) => s + (t.amount || 0), 0);
      const cost = transactions.filter(t => t.type === 'cost' && t.date?.startsWith(monthStr)).reduce((s, t) => s + (t.amount || 0), 0);
      return rev > 0 ? Math.round(((rev - cost) / rev) * 1000) / 10 : 0;
    }
    case 'satisfaction_avg': {
      const active = employees.filter(e => e.status === 'active' && e.satisfaction_score != null);
      return active.length > 0 ? Math.round(active.reduce((s, e) => s + e.satisfaction_score, 0) / active.length * 10) / 10 : 0;
    }
    case 'employee_count':
      return employees.filter(e => e.status === 'active').length;
    default:
      return kpi.current_value ?? 0;
  }
}

function kpiStatus(kpi, current) {
  const ratio = kpi.direction === 'down'
    ? kpi.target_value / (current || 1)
    : (current || 0) / (kpi.target_value || 1);
  if (kpi.direction === 'down' ? current <= kpi.target_value : current >= kpi.target_value) return 'achieved';
  if (ratio >= 0.8) return 'on_track';
  if (ratio >= 0.5) return 'at_risk';
  return 'failed';
}

const STATUS_COLORS = { achieved: 'text-emerald-600 bg-emerald-50', on_track: 'text-blue-600 bg-blue-50', at_risk: 'text-amber-600 bg-amber-50', failed: 'text-red-600 bg-red-50' };
const STATUS_LABELS = { achieved: 'Atingido', on_track: 'No prazo', at_risk: 'Em risco', failed: 'Falhou' };

function fmtMoney(v) {
  if (v >= 1000000) return `€${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${Number(v).toFixed(0)}`;
}

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');

  const { data: transactions = [] } = useQuery({
    queryKey: ['business_transactions'],
    queryFn: () => base44.entities.BusinessTransaction.filter({}, '-date', 500),
  });
  const { data: kpis = [] } = useQuery({
    queryKey: ['business_kpis'],
    queryFn: () => base44.entities.BusinessKPI.filter({ is_active: true }),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.filter(),
  });

  const monthRevenue = useMemo(() =>
    transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(currentMonth)).reduce((s, t) => s + (t.amount || 0), 0),
    [transactions, currentMonth]);

  const monthCosts = useMemo(() =>
    transactions.filter(t => ['cost', 'investment', 'tax'].includes(t.type) && t.date?.startsWith(currentMonth)).reduce((s, t) => s + (t.amount || 0), 0),
    [transactions, currentMonth]);

  const avgSatisfaction = useMemo(() => {
    const active = employees.filter(e => e.satisfaction_score != null);
    return active.length > 0 ? (active.reduce((s, e) => s + e.satisfaction_score, 0) / active.length).toFixed(1) : '—';
  }, [employees]);

  // Last 6 months chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      const m = format(d, 'yyyy-MM');
      const rev = transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
      const cost = transactions.filter(t => ['cost', 'investment', 'tax'].includes(t.type) && t.date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
      return { month: format(d, 'MMM', { locale: pt }), revenue: rev, costs: cost, net: rev - cost };
    });
  }, [transactions]);

  // KPIs at risk
  const kpisAtRisk = useMemo(() =>
    kpis.filter(k => {
      const cv = calcKPICurrentValue(k, transactions, employees, currentMonth);
      const st = kpiStatus(k, cv);
      return st === 'at_risk' || st === 'failed';
    }).slice(0, 3),
    [kpis, transactions, employees, currentMonth]);

  // Dept budget utilization
  const deptData = useMemo(() =>
    departments.map(dept => {
      const spent = transactions.filter(t => t.department === dept.name && t.date?.startsWith(currentMonth)).reduce((s, t) => s + (t.amount || 0), 0);
      return { name: dept.name, budget: dept.budget_monthly || 0, spent, pct: dept.budget_monthly > 0 ? Math.round((spent / dept.budget_monthly) * 100) : 0 };
    }).filter(d => d.budget > 0).slice(0, 5),
    [departments, transactions, currentMonth]);

  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  const grossMargin = monthRevenue > 0 ? ((monthRevenue - monthCosts) / monthRevenue * 100).toFixed(1) : '0.0';

  const kpiCount = { achieved: 0, on_track: 0, at_risk: 0, failed: 0 };
  kpis.forEach(k => { kpiCount[kpiStatus(k, calcKPICurrentValue(k, transactions, employees, currentMonth))]++; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">{format(now, "MMMM 'de' yyyy", { locale: pt })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/BusinessTransactions')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Transação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Receita', value: fmtMoney(monthRevenue), icon: TrendingUp, color: 'emerald', sub: 'este mês' },
          { label: 'Custos', value: fmtMoney(monthCosts), icon: TrendingDown, color: 'red', sub: 'este mês' },
          { label: 'Resultado', value: fmtMoney(monthRevenue - monthCosts), icon: Wallet, color: monthRevenue >= monthCosts ? 'blue' : 'rose', sub: 'líquido' },
          { label: 'Margem Bruta', value: `${grossMargin}%`, icon: Target, color: parseFloat(grossMargin) >= 40 ? 'emerald' : 'amber', sub: 'este mês' },
          { label: 'Satisfação', value: `${avgSatisfaction}/5`, icon: Users, color: 'violet', sub: `${employees.length} colaboradores` },
          { label: 'KPIs OK', value: `${kpiCount.achieved + kpiCount.on_track}/${kpis.length}`, icon: CheckCircle, color: kpisAtRisk.length === 0 ? 'emerald' : 'amber', sub: `${kpisAtRisk.length} em risco` },
        ].map((card, i) => {
          const Icon = card.icon;
          const colorMap = { emerald: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700', rose: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${colorMap[card.color]} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Costs 6 months */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Receitas vs Custos — Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v, n) => [`€${v.toLocaleString('pt-PT')}`, n === 'revenue' ? 'Receita' : 'Custos']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} fill="url(#costGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dept budget utilization */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Orçamento por Departamento</h3>
          </div>
          {deptData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Building2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Sem departamentos</p>
              <button onClick={() => navigate('/BusinessEmployees')} className="mt-2 text-xs text-amber-600 font-medium">Adicionar →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {deptData.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                    <span className={`text-xs font-bold ${d.pct > 100 ? 'text-red-600' : d.pct > 80 ? 'text-amber-600' : 'text-slate-500'}`}>{d.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${d.pct > 100 ? 'bg-red-500' : d.pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(d.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: KPIs at risk + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KPIs at risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">KPIs em Risco</h3>
            <button onClick={() => navigate('/BusinessKPIs')} className="text-xs text-amber-600 font-medium flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></button>
          </div>
          {kpisAtRisk.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400">
              <CheckCircle className="w-8 h-8 mb-2 text-emerald-400" />
              <p className="text-xs text-emerald-600 font-medium">Todos os KPIs no prazo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpisAtRisk.map(k => {
                const cv = calcKPICurrentValue(k, transactions, employees, currentMonth);
                const st = kpiStatus(k, cv);
                return (
                  <div key={k.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${st === 'failed' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{k.name}</p>
                      <p className="text-xs text-slate-500">{cv}{k.unit} / {k.target_value}{k.unit}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[st]}`}>{STATUS_LABELS[st]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Transações Recentes</h3>
            <button onClick={() => navigate('/BusinessTransactions')} className="text-xs text-amber-600 font-medium flex items-center gap-1">Ver todas <ArrowRight className="w-3 h-3" /></button>
          </div>
          {recentTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400">
              <Wallet className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Sem transações</p>
              <button onClick={() => navigate('/BusinessTransactions')} className="mt-2 text-xs text-amber-600 font-medium">Adicionar →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${tx.type === 'revenue' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {tx.type === 'revenue' ? '💰' : tx.type === 'investment' ? '📊' : tx.type === 'tax' ? '🧾' : '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.title}</p>
                    <p className="text-xs text-slate-400">{tx.department || tx.category} · {tx.date}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'revenue' ? '+' : '-'}€{Number(tx.amount).toLocaleString('pt-PT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
