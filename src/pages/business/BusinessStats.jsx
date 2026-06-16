import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { TrendingUp, TrendingDown, BarChart3, Building2, Calculator } from 'lucide-react';

function fmtMoney(v, decimals = 0) {
  const abs = Math.abs(v);
  if (abs >= 1000000) return `€${(v / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${Number(v).toFixed(decimals)}`;
}

function fmtPct(v) { return `${Number(v).toFixed(1)}%`; }

const TABS = [
  { key: 'pl', label: 'P&L', icon: TrendingUp },
  { key: 'cashflow', label: 'Cash Flow', icon: BarChart3 },
  { key: 'departments', label: 'Departamentos', icon: Building2 },
  { key: 'ratios', label: 'Rácios', icon: Calculator },
];

const MONTHS = Array.from({ length: 12 }).map((_, i) => {
  const d = subMonths(new Date(), 11 - i);
  return { label: format(d, 'MMM', { locale: pt }), key: format(d, 'yyyy-MM') };
});

export default function BusinessStats() {
  const [tab, setTab] = useState('pl');
  const [period, setPeriod] = useState('6m');

  const { data: transactions = [] } = useQuery({
    queryKey: ['business_transactions'],
    queryFn: () => base44.entities.BusinessTransaction.filter({}, '-date', 500),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.filter(),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.filter(),
  });

  const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const months = MONTHS.slice(-monthCount);

  // P&L data per month
  const plMonths = useMemo(() => months.map(m => {
    const rev = transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const salaries = transactions.filter(t => t.category === 'salaries' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const opCosts = transactions.filter(t => t.type === 'cost' && t.category !== 'salaries' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const invest = transactions.filter(t => t.type === 'investment' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const taxes = transactions.filter(t => t.type === 'tax' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const grossProfit = rev - opCosts - salaries;
    const ebitda = grossProfit - invest;
    const net = ebitda - taxes;
    return { month: m.label, rev, salaries, opCosts, invest, taxes, grossProfit, ebitda, net };
  }), [transactions, months]);

  const totPL = useMemo(() => plMonths.reduce((acc, m) => ({
    rev: acc.rev + m.rev,
    salaries: acc.salaries + m.salaries,
    opCosts: acc.opCosts + m.opCosts,
    invest: acc.invest + m.invest,
    taxes: acc.taxes + m.taxes,
    grossProfit: acc.grossProfit + m.grossProfit,
    ebitda: acc.ebitda + m.ebitda,
    net: acc.net + m.net,
  }), { rev: 0, salaries: 0, opCosts: 0, invest: 0, taxes: 0, grossProfit: 0, ebitda: 0, net: 0 }), [plMonths]);

  // Cash flow chart
  const cfData = useMemo(() => months.map(m => {
    const inflow = transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    const outflow = transactions.filter(t => ['cost', 'investment', 'tax'].includes(t.type) && t.date?.startsWith(m.key)).reduce((s, t) => s + (t.amount || 0), 0);
    return { month: m.label, inflow, outflow, net: inflow - outflow };
  }), [transactions, months]);

  // Dept data
  const deptData = useMemo(() => departments.map(d => {
    const months12 = MONTHS.slice(-monthCount);
    const spent = months12.reduce((total, m) => {
      return total + transactions.filter(t => t.department === d.name && t.date?.startsWith(m.key) && t.type !== 'revenue').reduce((s, t) => s + (t.amount || 0), 0);
    }, 0);
    const budget = (d.budget_monthly || 0) * monthCount;
    return { name: d.name, budget, spent, pct: budget > 0 ? Math.round((spent / budget) * 100) : 0, diff: spent - budget };
  }), [departments, transactions, monthCount]);

  // Ratios
  const ratios = useMemo(() => {
    const rev = totPL.rev;
    const costs = totPL.salaries + totPL.opCosts;
    const grossMargin = rev > 0 ? ((rev - costs) / rev) * 100 : 0;
    const netMargin = rev > 0 ? (totPL.net / rev) * 100 : 0;
    const costToRev = rev > 0 ? (costs / rev) * 100 : 0;
    const activeEmp = employees.filter(e => e.status === 'active').length;
    const revPerEmp = activeEmp > 0 ? rev / activeEmp : 0;
    const costPerEmp = activeEmp > 0 ? costs / activeEmp : 0;
    const salaryRatio = rev > 0 ? (totPL.salaries / rev) * 100 : 0;
    return { grossMargin, netMargin, costToRev, revPerEmp, costPerEmp, salaryRatio };
  }, [totPL, employees]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Análise Financeira</h1>
        <div className="flex gap-1.5">
          {[{ v: '3m', l: '3 meses' }, { v: '6m', l: '6 meses' }, { v: '12m', l: '12 meses' }].map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p.v ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* P&L Tab */}
      {tab === 'pl' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm">Evolução do Resultado</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={plMonths} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtMoney(v)} />
                <Tooltip formatter={(v, n) => [fmtMoney(v, 2), { rev: 'Receita', net: 'Resultado' }[n] || n]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={2} fill="url(#revG)" />
                <Area type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} fill="url(#netG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* P&L Statement */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-semibold text-slate-700 text-sm">Demonstração de Resultados — {monthCount} meses</h3>
            </div>
            {[
              { label: 'Receitas totais', value: totPL.rev, positive: true, bold: true, border: false },
              { label: 'Custo de pessoal (salários)', value: -totPL.salaries, positive: false, bold: false, border: false },
              { label: 'Custos operacionais', value: -totPL.opCosts, positive: false, bold: false, border: false },
              { label: 'Resultado bruto', value: totPL.grossProfit, positive: totPL.grossProfit >= 0, bold: true, border: true },
              { label: 'Investimentos / CAPEX', value: -totPL.invest, positive: false, bold: false, border: false },
              { label: 'EBITDA', value: totPL.ebitda, positive: totPL.ebitda >= 0, bold: true, border: true },
              { label: 'Impostos', value: -totPL.taxes, positive: false, bold: false, border: false },
              { label: 'Resultado líquido estimado', value: totPL.net, positive: totPL.net >= 0, bold: true, border: true, highlight: true },
            ].map(row => (
              <div key={row.label} className={`flex justify-between items-center px-5 py-3 ${row.border ? 'border-t border-slate-100' : ''} ${row.highlight ? 'bg-slate-50' : ''}`}>
                <span className={`text-sm ${row.bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{row.label}</span>
                <span className={`text-sm font-bold ${row.positive ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(row.value, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {tab === 'cashflow' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm">Entradas e Saídas de Caixa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cfData} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtMoney(v)} />
                <Tooltip formatter={(v, n) => [fmtMoney(v, 2), { inflow: 'Entradas', outflow: 'Saídas', net: 'Saldo' }[n] || n]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} name="inflow" />
                <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} name="outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: 'Total Entradas', v: cfData.reduce((s, m) => s + m.inflow, 0), color: 'emerald' },
              { l: 'Total Saídas', v: cfData.reduce((s, m) => s + m.outflow, 0), color: 'red' },
              { l: 'Saldo Período', v: cfData.reduce((s, m) => s + m.net, 0), color: cfData.reduce((s, m) => s + m.net, 0) >= 0 ? 'blue' : 'rose' },
            ].map(c => {
              const colorMap = { emerald: 'text-emerald-600', red: 'text-red-600', blue: 'text-blue-600', rose: 'text-rose-600' };
              return (
                <div key={c.l} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                  <p className="text-xs text-slate-500 mb-1">{c.l}</p>
                  <p className={`text-lg font-bold ${colorMap[c.color]}`}>{fmtMoney(c.v)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <div className="space-y-4">
          {deptData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
              <Building2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-slate-500 font-medium">Sem departamentos configurados</p>
              <p className="text-sm mt-1">Adiciona departamentos na secção Equipa</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4 text-sm">Orçamento vs Real por Departamento</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtMoney(v)} />
                    <Tooltip formatter={(v, n) => [fmtMoney(v, 2), n === 'budget' ? 'Orçamento' : 'Gasto']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="budget" />
                    <Bar dataKey="spent" radius={[4, 4, 0, 0]} name="spent">
                      {deptData.map((d, i) => <Cell key={i} fill={d.pct > 100 ? '#ef4444' : d.pct > 80 ? '#f59e0b' : '#10b981'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Detalhe por Departamento</h3>
                </div>
                {deptData.map(d => (
                  <div key={d.name} className="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.pct > 100 ? 'bg-red-500' : d.pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(d.pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${d.pct > 100 ? 'text-red-600' : d.pct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.pct}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">{fmtMoney(d.spent)}</p>
                      <p className="text-xs text-slate-400">de {fmtMoney(d.budget)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Ratios Tab */}
      {tab === 'ratios' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { label: 'Margem Bruta', value: fmtPct(ratios.grossMargin), sub: 'Receitas − custos operacionais', good: ratios.grossMargin >= 40, icon: '📊' },
            { label: 'Margem Líquida', value: fmtPct(ratios.netMargin), sub: 'Resultado após impostos', good: ratios.netMargin >= 10, icon: '💰' },
            { label: 'Rácio Custos/Receita', value: fmtPct(ratios.costToRev), sub: 'Custos operacionais vs receitas', good: ratios.costToRev <= 60, icon: '⚖️' },
            { label: 'Receita por Colaborador', value: fmtMoney(ratios.revPerEmp), sub: `${employees.filter(e => e.status === 'active').length} colaboradores ativos`, good: ratios.revPerEmp > 0, icon: '👤' },
            { label: 'Custo por Colaborador', value: fmtMoney(ratios.costPerEmp), sub: 'Custo médio por pessoa', good: true, icon: '💼' },
            { label: 'Rácio Pessoal/Receita', value: fmtPct(ratios.salaryRatio), sub: 'Salários como % das receitas', good: ratios.salaryRatio <= 40, icon: '👥' },
          ].map((r, i) => (
            <motion.div key={r.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{r.icon}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{r.label}</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mb-1">{r.value}</p>
              <p className="text-xs text-slate-400">{r.sub}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
