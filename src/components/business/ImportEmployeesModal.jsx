import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Users, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { extractTextFromFile } from '@/lib/fileParser';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_LABELS = { active: 'Ativo', inactive: 'Inativo', on_leave: 'Licença' };
const STATUS_COLORS = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-100 text-slate-600', on_leave: 'bg-amber-100 text-amber-700' };

const AI_PROMPT_EMPLOYEES = `Analisa o seguinte conteúdo e extrai todos os colaboradores.
Devolve APENAS um JSON array válido, sem texto adicional, sem markdown, sem blocos de código.
Cada objeto deve ter:
- "name": string (nome completo)
- "email": string (opcional)
- "role": string (cargo/função)
- "department": string (departamento, opcional)
- "hire_date": string "YYYY-MM-DD" (data de admissão, opcional)
- "salary": number (salário mensal em euros, opcional)
- "status": "active" | "inactive" | "on_leave" (padrão: "active")
- "satisfaction_score": number entre 1 e 5 (opcional)
- "notes": string (opcional)

Conteúdo:
`;

const AI_PROMPT_DEPTS = `Analisa o seguinte conteúdo e extrai todos os departamentos.
Devolve APENAS um JSON array válido, sem texto adicional, sem markdown, sem blocos de código.
Cada objeto deve ter:
- "name": string (nome do departamento)
- "manager": string (responsável, opcional)
- "monthly_budget": number (orçamento mensal em euros, opcional)
- "description": string (opcional)

Conteúdo:
`;

function ImportStep({ title, prompt, entityKey, renderRow, fields, onDone }) {
  const [step, setStep] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef();
  const qc = useQueryClient();

  const handleFile = async (f) => {
    setFile(f); setError(''); setStep('parsing');
    try {
      const text = await extractTextFromFile(f);
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + text.slice(0, 8000),
        add_context_from_internet: false,
      });
      const jsonStr = raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
      const rows = JSON.parse(jsonStr);
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('Nenhum registo encontrado.');
      setParsed(rows);
      setSelected(new Set(rows.map((_, i) => i)));
      setStep('preview');
    } catch (e) {
      setError(e.message?.includes('JSON') ? 'A IA não conseguiu interpretar o ficheiro. Tenta um formato mais estruturado.' : e.message);
      setStep('upload');
    }
  };

  const handleSave = async () => {
    setStep('saving');
    const toSave = parsed.filter((_, i) => selected.has(i));
    for (const row of toSave) {
      await base44.entities[entityKey].create(fields(row));
    }
    qc.invalidateQueries({ queryKey: [entityKey.toLowerCase() + 's'] });
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['departments'] });
    setStep('done');
    onDone?.(selected.size);
  };

  const toggleRow = (i) => setSelected(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
  });

  if (step === 'parsing' || step === 'saving') return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      <p className="text-sm text-slate-600">{step === 'parsing' ? `A IA está a analisar ${file?.name}…` : 'A guardar registos…'}</p>
    </div>
  );

  if (step === 'done') return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      <p className="font-semibold text-slate-800">Importação concluída!</p>
      <p className="text-sm text-slate-500">{selected.size} {title.toLowerCase()} importados com sucesso.</p>
    </div>
  );

  if (step === 'preview') return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-semibold">{parsed.length}</span> {title.toLowerCase()} encontrados</p>
        <button onClick={() => setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((_, i) => i)))}
          className="text-xs text-amber-700 hover:underline">
          {selected.size === parsed.length ? 'Desselecionar tudo' : 'Selecionar tudo'}
        </button>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {parsed.map((row, i) => (
          <div key={i} onClick={() => toggleRow(i)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selected.has(i) ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white opacity-50'
            }`}>
            <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
              selected.has(i) ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
            }`}>
              {selected.has(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            {renderRow(row)}
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={selected.size === 0}
        className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold">
        Importar {selected.size} {title.toLowerCase()}
      </Button>
    </div>
  );

  // Upload
  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-9 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
        }`}
      >
        <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2" />
        <p className="font-medium text-slate-700 text-sm">Arrasta o ficheiro ou clica para selecionar</p>
        <p className="text-xs text-slate-400 mt-1">CSV, Excel (.xlsx) ou PDF</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
          onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}
    </div>
  );
}

export default function ImportEmployeesModal({ isOpen, onClose, defaultTab = 'employees' }) {
  const [tab, setTab] = useState(defaultTab);
  const [empDone, setEmpDone] = useState(false);
  const [deptDone, setDeptDone] = useState(false);

  const handleClose = () => { setEmpDone(false); setDeptDone(false); setTab(defaultTab); onClose(); };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-600" />
            Importar via Ficheiro
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
          {[['employees', Users, 'Colaboradores'], ['departments', Building2, 'Departamentos']].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pt-1">
          {tab === 'employees' && (
            <ImportStep
              key="emp"
              title="Colaboradores"
              prompt={AI_PROMPT_EMPLOYEES}
              entityKey="Employee"
              fields={r => ({
                name:               r.name || 'Sem nome',
                email:              r.email || '',
                role:               r.role || '',
                department:         r.department || '',
                hire_date:          r.hire_date || '',
                salary:             r.salary ? Number(r.salary) : null,
                status:             ['active','inactive','on_leave'].includes(r.status) ? r.status : 'active',
                satisfaction_score: r.satisfaction_score ? Math.min(5, Math.max(1, Number(r.satisfaction_score))) : null,
                notes:              r.notes || '',
              })}
              renderRow={r => (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {[r.role, r.department].filter(Boolean).join(' · ')}
                    {r.salary ? ` · €${Number(r.salary).toLocaleString('pt-PT')}/mês` : ''}
                  </p>
                </div>
              )}
              onDone={() => setEmpDone(true)}
            />
          )}
          {tab === 'departments' && (
            <ImportStep
              key="dept"
              title="Departamentos"
              prompt={AI_PROMPT_DEPTS}
              entityKey="Department"
              fields={r => ({
                name:           r.name || 'Sem nome',
                manager:        r.manager || '',
                monthly_budget: r.monthly_budget ? Number(r.monthly_budget) : null,
                description:    r.description || '',
              })}
              renderRow={r => (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {r.manager ? `Responsável: ${r.manager}` : ''}
                    {r.monthly_budget ? ` · €${Number(r.monthly_budget).toLocaleString('pt-PT')}/mês` : ''}
                  </p>
                </div>
              )}
              onDone={() => setDeptDone(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
