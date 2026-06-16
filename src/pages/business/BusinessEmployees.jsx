import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Building2, Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// ─── Employee Modal ───────────────────────────────────────────────
function EmployeeModal({ isOpen, onClose, onSave, editEmp, departments }) {
  const empty = () => ({ name: '', role: '', department: '', hire_date: '', salary: '', status: 'active', satisfaction_score: '', courses_completed: 0 });
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (editEmp) {
      setForm({ name: editEmp.name || '', role: editEmp.role || '', department: editEmp.department || '', hire_date: editEmp.hire_date || '', salary: editEmp.salary ?? '', status: editEmp.status || 'active', satisfaction_score: editEmp.satisfaction_score ?? '', courses_completed: editEmp.courses_completed || 0 });
    } else setForm(empty());
  }, [editEmp, isOpen]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nome obrigatório');
    setSaving(true);
    await onSave({ ...form, salary: form.salary !== '' ? parseFloat(form.salary) : null, satisfaction_score: form.satisfaction_score !== '' ? parseFloat(form.satisfaction_score) : null }, editEmp?.id);
    setSaving(false); onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[75]" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-12 sm:w-full sm:max-w-lg z-[80] bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">{editEmp ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label>Cargo / Função</Label>
                  <Input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Ex: Gestor de Projeto" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <select value={form.department} onChange={e => set('department', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">— Nenhum —</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Data de Entrada</Label>
                  <Input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label>Salário Bruto Mensal (€)</Label>
                  <Input type="number" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="0.00" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label>Score de Satisfação (0–5)</Label>
                  <Input type="number" min="0" max="5" step="0.1" value={form.satisfaction_score} onChange={e => set('satisfaction_score', e.target.value)} placeholder="Ex: 4.2" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="leave">Licença</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Cancelar</button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editEmp ? 'Guardar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Department Modal ───────────────────────────────────────────────
function DeptModal({ isOpen, onClose, onSave, editDept }) {
  const empty = () => ({ name: '', budget_monthly: '', manager: '' });
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm(editDept ? { name: editDept.name || '', budget_monthly: editDept.budget_monthly ?? '', manager: editDept.manager || '' } : empty());
  }, [editDept, isOpen]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nome obrigatório');
    setSaving(true);
    await onSave({ ...form, budget_monthly: form.budget_monthly !== '' ? parseFloat(form.budget_monthly) : 0 }, editDept?.id);
    setSaving(false); onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[75]" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/4 sm:w-full sm:max-w-md z-[80] bg-white rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">{editDept ? 'Editar Departamento' : 'Novo Departamento'}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Marketing" className="mt-1.5 h-11 rounded-xl" /></div>
              <div><Label>Gestor Responsável</Label><Input value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Nome do responsável" className="mt-1.5 h-11 rounded-xl" /></div>
              <div><Label>Orçamento Mensal (€)</Label><Input type="number" value={form.budget_monthly} onChange={e => set('budget_monthly', e.target.value)} placeholder="0.00" className="mt-1.5 h-11 rounded-xl" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Cancelar</button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editDept ? 'Guardar' : 'Criar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function BusinessEmployees() {
  const qc = useQueryClient();
  const [empModal, setEmpModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [editDept, setEditDept] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [deptFilter, setDeptFilter] = useState('all');

  const { data: employees = [] } = useQuery({ queryKey: ['employees_all'], queryFn: () => base44.entities.Employee.filter() });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => base44.entities.Department.filter() });

  const filtered = useMemo(() =>
    employees.filter(e => deptFilter === 'all' || e.department === deptFilter),
    [employees, deptFilter]);

  const avgSatisfaction = useMemo(() => {
    const active = employees.filter(e => e.status === 'active' && e.satisfaction_score != null);
    return active.length > 0 ? (active.reduce((s, e) => s + e.satisfaction_score, 0) / active.length).toFixed(1) : '—';
  }, [employees]);

  const totalSalaryCost = useMemo(() =>
    employees.filter(e => e.status === 'active').reduce((s, e) => s + (e.salary || 0), 0),
    [employees]);

  const handleSaveEmp = async (data, id) => {
    const me = await base44.auth.me();
    if (id) { await base44.entities.Employee.update(id, data); toast.success('Colaborador atualizado'); }
    else { await base44.entities.Employee.create({ ...data, created_by: me.email }); toast.success('Colaborador adicionado'); }
    qc.invalidateQueries({ queryKey: ['employees_all'] });
    qc.invalidateQueries({ queryKey: ['employees'] });
    setEditEmp(null);
  };

  const handleSaveDept = async (data, id) => {
    const me = await base44.auth.me();
    if (id) { await base44.entities.Department.update(id, data); toast.success('Departamento atualizado'); }
    else { await base44.entities.Department.create({ ...data, created_by: me.email }); toast.success('Departamento criado'); }
    qc.invalidateQueries({ queryKey: ['departments'] });
    setEditDept(null);
  };

  const handleDeleteEmp = async (id) => { await base44.entities.Employee.delete(id); qc.invalidateQueries({ queryKey: ['employees_all'] }); qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Eliminado'); };
  const handleDeleteDept = async (id) => { await base44.entities.Department.delete(id); qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Eliminado'); };

  const STATUS_LABEL = { active: 'Ativo', inactive: 'Inativo', leave: 'Licença' };
  const STATUS_COLOR = { active: 'text-emerald-700 bg-emerald-50', inactive: 'text-slate-500 bg-slate-100', leave: 'text-amber-700 bg-amber-50' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Equipa</h1>
        <div className="flex gap-2">
          <button onClick={() => { setEditDept(null); setDeptModal(true); }} className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors">
            <Building2 className="w-4 h-4" /> Depto
          </button>
          <button onClick={() => { setEditEmp(null); setEmpModal(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Colaborador
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Colaboradores Ativos', v: employees.filter(e => e.status === 'active').length, icon: '👥' },
          { l: 'Satisfação Média', v: `${avgSatisfaction}/5`, icon: '⭐' },
          { l: 'Custo Mensal Total', v: `€${totalSalaryCost.toLocaleString('pt-PT')}`, icon: '💼' },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xl font-bold text-slate-900">{s.v}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        {[{ k: 'employees', l: 'Colaboradores' }, { k: 'departments', l: 'Departamentos' }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.k ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Employees tab */}
      {activeTab === 'employees' && (
        <div className="space-y-3">
          {/* Dept filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setDeptFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${deptFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todos</button>
            {departments.map(d => (
              <button key={d.id} onClick={() => setDeptFilter(deptFilter === d.name ? 'all' : d.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${deptFilter === d.name ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {d.name}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-14 text-slate-400">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-slate-500 font-medium">Sem colaboradores</p>
              <button onClick={() => { setEditEmp(null); setEmpModal(true); }} className="mt-3 flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <AnimatePresence>
                {filtered.map(emp => (
                  <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-base font-bold text-amber-700 shrink-0">
                      {(emp.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[emp.status]}`}>{STATUS_LABEL[emp.status]}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[emp.role, emp.department].filter(Boolean).join(' · ')}
                        {emp.hire_date && ` · Desde ${emp.hire_date}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {emp.satisfaction_score != null && (
                        <div className="flex items-center gap-0.5 justify-end mb-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-700">{emp.satisfaction_score}</span>
                        </div>
                      )}
                      {emp.salary && <p className="text-xs text-slate-500">€{Number(emp.salary).toLocaleString('pt-PT')}/mês</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditEmp(emp); setEmpModal(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteEmp(emp.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Departments tab */}
      {activeTab === 'departments' && (
        <div className="space-y-3">
          {departments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-14 text-slate-400">
              <Building2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-slate-500 font-medium">Sem departamentos</p>
              <button onClick={() => { setEditDept(null); setDeptModal(true); }} className="mt-3 flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors">
                <Plus className="w-4 h-4" /> Criar departamento
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {departments.map(dept => {
                const headcount = employees.filter(e => e.department === dept.name && e.status === 'active').length;
                return (
                  <div key={dept.id} className="flex items-center gap-3 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {dept.manager && `👤 ${dept.manager} · `}{headcount} colaboradores{dept.budget_monthly > 0 && ` · €${Number(dept.budget_monthly).toLocaleString('pt-PT')}/mês`}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditDept(dept); setDeptModal(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteDept(dept.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <EmployeeModal isOpen={empModal} onClose={() => { setEmpModal(false); setEditEmp(null); }} onSave={handleSaveEmp} editEmp={editEmp} departments={departments} />
      <DeptModal isOpen={deptModal} onClose={() => { setDeptModal(false); setEditDept(null); }} onSave={handleSaveDept} editDept={editDept} />
    </div>
  );
}
