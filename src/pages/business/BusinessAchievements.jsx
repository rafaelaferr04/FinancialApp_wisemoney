import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Trophy } from 'lucide-react';

const currentMonth = format(new Date(), 'yyyy-MM');
const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

function checkAchievements(transactions, kpis, employees, departments) {
  const rev = (m) => transactions.filter(t => t.type === 'revenue' && t.date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);
  const cost = (m) => transactions.filter(t => ['cost', 'investment', 'tax'].includes(t.type) && t.date?.startsWith(m)).reduce((s, t) => s + (t.amount || 0), 0);

  const monthRev = rev(currentMonth);
  const monthCost = cost(currentMonth);
  const grossMargin = monthRev > 0 ? ((monthRev - monthCost) / monthRev) * 100 : 0;
  const activeEmp = employees.filter(e => e.status === 'active').length;
  const avgSat = employees.filter(e => e.status === 'active' && e.satisfaction_score != null);
  const satAvg = avgSat.length > 0 ? avgSat.reduce((s, e) => s + e.satisfaction_score, 0) / avgSat.length : 0;
  const totalTx = transactions.length;
  const achievedKPIs = kpis.filter(k => {
    const curr = k.current_value ?? 0;
    return k.direction === 'down' ? curr <= k.target_value : curr >= k.target_value;
  });

  const allAchs = [
    {
      id: 'first_transaction',
      icon: '💸',
      title: 'Primeira Transação',
      desc: 'Registaste a primeira transação business.',
      category: 'operacional',
      unlocked: totalTx >= 1,
      rarity: 'common',
    },
    {
      id: 'ten_transactions',
      icon: '📋',
      title: 'Gestor Financeiro',
      desc: '10 transações registadas.',
      category: 'operacional',
      unlocked: totalTx >= 10,
      rarity: 'common',
    },
    {
      id: 'first_100k_revenue',
      icon: '💰',
      title: 'Primeiro €100k',
      desc: 'Atingiste €100.000 em receitas mensais.',
      category: 'financeiro',
      unlocked: monthRev >= 100000,
      rarity: 'rare',
    },
    {
      id: 'first_200k_revenue',
      icon: '🚀',
      title: 'Escala',
      desc: 'Receita mensal acima de €200.000.',
      category: 'financeiro',
      unlocked: monthRev >= 200000,
      rarity: 'epic',
    },
    {
      id: 'positive_cashflow',
      icon: '📈',
      title: 'Cash Flow Positivo',
      desc: 'Receitas superiores a custos este mês.',
      category: 'financeiro',
      unlocked: monthRev > monthCost,
      rarity: 'common',
    },
    {
      id: 'margin_40',
      icon: '🎯',
      title: 'Margem Sólida',
      desc: 'Margem bruta acima de 40%.',
      category: 'financeiro',
      unlocked: grossMargin >= 40,
      rarity: 'rare',
    },
    {
      id: 'margin_60',
      icon: '⚡',
      title: 'Eficiência Máxima',
      desc: 'Margem bruta acima de 60% — excelente!',
      category: 'financeiro',
      unlocked: grossMargin >= 60,
      rarity: 'epic',
    },
    {
      id: 'first_employee',
      icon: '🤝',
      title: 'Primeiro Colaborador',
      desc: 'Adicionaste o primeiro colaborador à equipa.',
      category: 'rh',
      unlocked: activeEmp >= 1,
      rarity: 'common',
    },
    {
      id: 'team_10',
      icon: '👥',
      title: 'Equipa a Crescer',
      desc: '10 colaboradores ativos.',
      category: 'rh',
      unlocked: activeEmp >= 10,
      rarity: 'rare',
    },
    {
      id: 'team_50',
      icon: '🏢',
      title: 'Empresa Estruturada',
      desc: '50 ou mais colaboradores ativos.',
      category: 'rh',
      unlocked: activeEmp >= 50,
      rarity: 'epic',
    },
    {
      id: 'satisfaction_4',
      icon: '😊',
      title: 'Equipa Satisfeita',
      desc: 'Score médio de satisfação ≥ 4.0.',
      category: 'rh',
      unlocked: satAvg >= 4.0,
      rarity: 'rare',
    },
    {
      id: 'satisfaction_45',
      icon: '🌟',
      title: 'Ótimo Ambiente',
      desc: 'Score médio de satisfação ≥ 4.5 — referência de excelência.',
      category: 'rh',
      unlocked: satAvg >= 4.5,
      rarity: 'legendary',
    },
    {
      id: 'first_kpi',
      icon: '🎯',
      title: 'Foco Estratégico',
      desc: 'Definiste o primeiro KPI empresarial.',
      category: 'estrategia',
      unlocked: kpis.length >= 1,
      rarity: 'common',
    },
    {
      id: 'kpi_achieved',
      icon: '✅',
      title: 'Objetivo Atingido',
      desc: 'Atingiste o objetivo de pelo menos 1 KPI.',
      category: 'estrategia',
      unlocked: achievedKPIs.length >= 1,
      rarity: 'rare',
    },
    {
      id: 'all_kpis_green',
      icon: '🏆',
      title: 'Todos os KPIs no Verde',
      desc: 'Todos os KPIs ativos estão atingidos ou no prazo.',
      category: 'estrategia',
      unlocked: kpis.length > 0 && achievedKPIs.length === kpis.length,
      rarity: 'legendary',
    },
    {
      id: 'first_dept',
      icon: '🏗️',
      title: 'Estrutura Organizacional',
      desc: 'Criaste o primeiro departamento.',
      category: 'operacional',
      unlocked: departments.length >= 1,
      rarity: 'common',
    },
    {
      id: 'five_depts',
      icon: '🌐',
      title: 'Empresa Multi-Departamental',
      desc: '5 ou mais departamentos configurados.',
      category: 'operacional',
      unlocked: departments.length >= 5,
      rarity: 'rare',
    },
  ];

  return allAchs.sort((a, b) => b.unlocked - a.unlocked);
}

const RARITY = {
  common:    { label: 'Comum',     bg: 'bg-slate-50',   border: 'border-slate-200', badge: 'bg-slate-200 text-slate-600', icon: '⚪' },
  rare:      { label: 'Raro',      bg: 'bg-blue-50',    border: 'border-blue-200',  badge: 'bg-blue-200 text-blue-700',  icon: '🔵' },
  epic:      { label: 'Épico',     bg: 'bg-violet-50',  border: 'border-violet-200',badge: 'bg-violet-200 text-violet-700',icon: '🟣' },
  legendary: { label: 'Lendário',  bg: 'bg-amber-50',   border: 'border-amber-300', badge: 'bg-amber-200 text-amber-800', icon: '🟡' },
};

const CAT_LABELS = { financeiro: '💰 Financeiro', rh: '👥 Recursos Humanos', estrategia: '🎯 Estratégia', operacional: '⚙️ Operacional' };

export default function BusinessAchievements() {
  const { data: transactions = [] } = useQuery({ queryKey: ['business_transactions'], queryFn: () => base44.entities.BusinessTransaction.filter({}, '-date', 500) });
  const { data: kpis = [] } = useQuery({ queryKey: ['business_kpis'], queryFn: () => base44.entities.BusinessKPI.filter({ is_active: true }) });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.filter({ status: 'active' }) });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => base44.entities.Department.filter() });

  const achievements = useMemo(() => checkAchievements(transactions, kpis, employees, departments), [transactions, kpis, employees, departments]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const byCategory = useMemo(() => {
    const cats = {};
    achievements.forEach(a => {
      if (!cats[a.category]) cats[a.category] = [];
      cats[a.category].push(a);
    });
    return cats;
  }, [achievements]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Conquistas</h1>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-700">{unlockedCount} / {achievements.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Progresso geral</span>
          <span className="font-bold text-amber-600">{Math.round((unlockedCount / achievements.length) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
        </div>
        <div className="flex gap-4 mt-4 text-center">
          {Object.entries(RARITY).map(([k, r]) => {
            const count = achievements.filter(a => a.rarity === k && a.unlocked).length;
            const total = achievements.filter(a => a.rarity === k).length;
            return (
              <div key={k} className="flex-1">
                <span className="text-lg">{r.icon}</span>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{count}/{total}</p>
                <p className="text-[10px] text-slate-400">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* By category */}
      {Object.entries(byCategory).map(([cat, achs]) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">{CAT_LABELS[cat] || cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {achs.map((ach, i) => {
              const r = RARITY[ach.rarity];
              return (
                <motion.div key={ach.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${ach.unlocked ? `${r.bg} ${r.border}` : 'bg-white border-slate-100 opacity-50 grayscale'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${ach.unlocked ? '' : 'opacity-30'}`}>
                      {ach.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className={`text-sm font-bold ${ach.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{ach.title}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.badge}`}>{r.label}</span>
                      </div>
                      <p className={`text-xs ${ach.unlocked ? 'text-slate-600' : 'text-slate-400'}`}>{ach.desc}</p>
                      {!ach.unlocked && <p className="text-[10px] text-slate-400 mt-1 italic">Ainda não desbloqueado</p>}
                      {ach.unlocked && <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Conquistado</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
