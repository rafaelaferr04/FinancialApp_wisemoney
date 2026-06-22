import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = [
  { v: 'financial', l: 'Financeiro', e: '💰' },
  { v: 'hr', l: 'Recursos Humanos', e: '👥' },
  { v: 'operational', l: 'Operacional', e: '⚙️' },
  { v: 'growth', l: 'Crescimento', e: '📈' },
  { v: 'customer', l: 'Clientes', e: '🤝' },
  { v: 'sustainability', l: 'Sustentabilidade', e: '🌱' },
];

const UNITS = [
  { v: '€', l: 'Euro (€)' },
  { v: '%', l: 'Percentagem (%)' },
  { v: 'pts', l: 'Pontos (0–5)' },
  { v: '#', l: 'Número / Contagem' },
  { v: 'h', l: 'Horas' },
  { v: 'ratio', l: 'Rácio' },
  { v: 'days', l: 'Dias' },
];

const DATA_SOURCES = [
  { v: 'manual', l: '✍️ Manual — insiro o valor atual' },
  { v: 'transactions_revenue', l: '💰 Receitas do mês (automático)' },
  { v: 'transactions_cost', l: '💸 Custos do mês (automático)' },
  { v: 'gross_margin_pct', l: '📊 Margem bruta % (automático)' },
  { v: 'satisfaction_avg', l: '😊 Satisfação média colaboradores (automático)' },
  { v: 'employee_count', l: '👥 Nº colaboradores ativos (automático)' },
];

const PERIODS = [
  { v: 'monthly', l: 'Mensal' },
  { v: 'quarterly', l: 'Trimestral' },
  { v: 'annual', l: 'Anual' },
];

const empty = () => ({
  name: '', description: '', category: 'financial', unit: '€',
  target_value: '', current_value: '', direction: 'up',
  data_source: 'manual', period: 'monthly', responsible: '',
});

export default function AddEditKPIModal({ isOpen, onClose, onSave, editKPI = null }) {
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editKPI) {
      setForm({
        name: editKPI.name || '',
        description: editKPI.description || '',
        category: editKPI.category || 'financial',
        unit: editKPI.unit || '€',
        target_value: editKPI.target_value != null ? String(editKPI.target_value) : '',
        current_value: editKPI.current_value != null ? String(editKPI.current_value) : '',
        direction: editKPI.direction || 'up',
        data_source: editKPI.data_source || 'manual',
        period: editKPI.period || 'monthly',
        responsible: editKPI.responsible || '',
      });
    } else {
      setForm(empty());
    }
    setErrors({});
  }, [editKPI, isOpen]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Obrigatório';
    if (form.target_value === '' || isNaN(parseFloat(form.target_value))) e.target_value = 'Valor inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      ...form,
      target_value: parseFloat(form.target_value),
      current_value: form.data_source === 'manual' && form.current_value !== '' ? parseFloat(form.current_value) : 0,
    }, editKPI?.id);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center pt-4 sm:pt-8 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] z-10">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">{editKPI ? 'Editar KPI' : 'Novo KPI'}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <Label className="text-slate-700">Nome do KPI *</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ex: Satisfação dos colaboradores" className={`mt-1.5 h-11 rounded-xl ${errors.name ? 'border-rose-400' : ''}`} />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-slate-700">Descrição</Label>
                  <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="O que mede este KPI e porquê é importante..." className="mt-1.5 rounded-xl" rows={2} />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-slate-700">Categoria</Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c.v} type="button" onClick={() => set('category', c.v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${form.category === c.v ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <span>{c.e}</span> {c.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target + Unit + Direction */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label className="text-slate-700">Objetivo *</Label>
                    <Input type="number" step="any" value={form.target_value} onChange={e => set('target_value', e.target.value)} onWheel={e => e.target.blur()}
                      placeholder="Ex: 200000" className={`mt-1.5 h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.target_value ? 'border-rose-400' : ''}`} />
                    {errors.target_value && <p className="text-xs text-rose-500 mt-1">{errors.target_value}</p>}
                  </div>
                  <div>
                    <Label className="text-slate-700">Unidade</Label>
                    <select value={form.unit} onChange={e => set('unit', e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      {UNITS.map(u => <option key={u.v} value={u.v}>{u.v} — {u.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-700">Direção</Label>
                    <select value={form.direction} onChange={e => set('direction', e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="up">↑ Maior melhor</option>
                      <option value="down">↓ Menor melhor</option>
                    </select>
                  </div>
                </div>

                {/* Data source */}
                <div>
                  <Label className="text-slate-700">Fonte de dados (como calcular o valor atual)</Label>
                  <select value={form.data_source} onChange={e => set('data_source', e.target.value)}
                    className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {DATA_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {form.data_source === 'manual' ? 'Atualiza o valor atual manualmente quando quiseres.' : 'O valor atual é calculado automaticamente a partir dos dados da app.'}
                  </p>
                </div>

                {/* Current value (only for manual) */}
                {form.data_source === 'manual' && (
                  <div>
                    <Label className="text-slate-700">Valor atual</Label>
                    <Input type="number" step="any" value={form.current_value} onChange={e => set('current_value', e.target.value)} onWheel={e => e.target.blur()}
                      placeholder="Valor actual do KPI" className="mt-1.5 h-11 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                )}

                {/* Period + Responsible */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-700">Período</Label>
                    <select value={form.period} onChange={e => set('period', e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      {PERIODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-700">Responsável</Label>
                    <Input value={form.responsible} onChange={e => set('responsible', e.target.value)}
                      placeholder="Departamento ou nome" className="mt-1.5 h-11 rounded-xl" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editKPI ? 'Guardar Alterações' : 'Criar KPI'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
