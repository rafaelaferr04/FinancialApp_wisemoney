import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import AddBusinessTransactionSheet from '@/components/business/AddBusinessTransactionSheet';
import { toast } from 'sonner';

const TYPE_LABELS = { revenue: 'Receita', cost: 'Custo', investment: 'Investimento', tax: 'Imposto', transfer: 'Transferência' };
const TYPE_COLORS = { revenue: 'text-emerald-600 bg-emerald-50', cost: 'text-red-600 bg-red-50', investment: 'text-blue-600 bg-blue-50', tax: 'text-amber-600 bg-amber-50', transfer: 'text-slate-600 bg-slate-100' };
const TYPE_EMOJI = { revenue: '💰', cost: '💸', investment: '📊', tax: '🧾', transfer: '↔️' };
const STATUS_COLORS = { draft: 'text-slate-500 bg-slate-100', pending: 'text-amber-700 bg-amber-50', approved: 'text-blue-700 bg-blue-50', paid: 'text-emerald-700 bg-emerald-50' };
const STATUS_LABELS = { draft: 'Rascunho', pending: 'Pendente', approved: 'Aprovado', paid: 'Pago' };

export default function BusinessTransactions() {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['business_transactions'],
    queryFn: () => base44.entities.BusinessTransaction.filter({}, '-date', 500),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.filter(),
  });

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (monthFilter && !t.date?.startsWith(monthFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(t.title?.toLowerCase().includes(q) || t.entity_name?.toLowerCase().includes(q) || t.department?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, monthFilter, search]);

  const totals = useMemo(() => ({
    revenue: filtered.filter(t => t.type === 'revenue').reduce((s, t) => s + (t.amount || 0), 0),
    costs: filtered.filter(t => ['cost', 'investment', 'tax'].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0),
  }), [filtered]);

  const handleSave = async (data) => {
    const me = await base44.auth.me();
    await base44.entities.BusinessTransaction.create({ ...data, created_by: me.email });
    qc.invalidateQueries({ queryKey: ['business_transactions'] });
    toast.success('Transação registada');
  };

  const handleDelete = async (id) => {
    await base44.entities.BusinessTransaction.delete(id);
    qc.invalidateQueries({ queryKey: ['business_transactions'] });
    toast.success('Transação eliminada');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Transações</h1>
        <button onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas', value: totals.revenue, icon: TrendingUp, color: 'emerald' },
          { label: 'Custos', value: totals.costs, icon: TrendingDown, color: 'red' },
          { label: 'Resultado', value: totals.revenue - totals.costs, icon: Wallet, color: totals.revenue >= totals.costs ? 'blue' : 'rose' },
        ].map(c => {
          const Icon = c.icon;
          const colorMap = { emerald: 'text-emerald-600', red: 'text-red-600', blue: 'text-blue-600', rose: 'text-rose-600' };
          return (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${colorMap[c.color]}`}>€{Number(c.value).toLocaleString('pt-PT', { minimumFractionDigits: 0 })}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..." className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'revenue', 'cost', 'investment', 'tax'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter === t ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wallet className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium text-slate-500">Sem transações</p>
            <p className="text-sm mt-1">Adiciona a primeira transação para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <AnimatePresence>
              {filtered.map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${TYPE_COLORS[tx.type]}`}>
                    {TYPE_EMOJI[tx.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{tx.title}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[tx.status]}`}>{STATUS_LABELS[tx.status]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span>{tx.date}</span>
                      {tx.department && <><span>·</span><span>{tx.department}</span></>}
                      {tx.entity_name && <><span>·</span><span>{tx.entity_name}</span></>}
                      {tx.invoice_number && <><span>·</span><span>{tx.invoice_number}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base font-bold ${tx.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'revenue' ? '+' : '-'}€{Number(tx.amount).toLocaleString('pt-PT')}
                    </p>
                    <p className="text-xs text-slate-400">{TYPE_LABELS[tx.type]}</p>
                  </div>
                  <button onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddBusinessTransactionSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} onSave={handleSave} departments={departments} />
    </div>
  );
}
