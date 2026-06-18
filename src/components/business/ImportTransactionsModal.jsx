import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { extractTextFromFile } from '@/lib/fileParser';
import { useQueryClient } from '@tanstack/react-query';

const TYPE_LABELS = { revenue: 'Receita', cost: 'Custo', investment: 'Investimento', tax: 'Imposto' };
const TYPE_COLORS = {
  revenue:    'bg-emerald-100 text-emerald-700',
  cost:       'bg-rose-100 text-rose-700',
  investment: 'bg-blue-100 text-blue-700',
  tax:        'bg-slate-100 text-slate-600',
};

const AI_PROMPT = `Analisa o seguinte conteúdo de ficheiro e extrai todas as transações financeiras empresariais que encontrares.
Devolve APENAS um JSON array válido, sem texto adicional, sem markdown, sem blocos de código.
Cada objeto deve ter:
- "title": string (descrição da transação)
- "type": "revenue" | "cost" | "investment" | "tax"
- "amount": number (valor positivo, em euros)
- "date": string "YYYY-MM-DD" (se não for claro, usa a data de hoje: ${new Date().toISOString().split('T')[0]})
- "category": string (ex: "vendas", "pessoal", "marketing", "fornecedores", "irs", etc.)
- "notes": string (opcional, informação adicional relevante)

Conteúdo do ficheiro:
`;

export default function ImportTransactionsModal({ isOpen, onClose }) {
  const [step, setStep] = useState('upload'); // upload | parsing | preview | saving | done
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef();
  const qc = useQueryClient();

  const reset = () => {
    setStep('upload'); setFile(null); setError('');
    setParsed([]); setSelected(new Set());
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (f) => {
    setFile(f);
    setError('');
    setStep('parsing');
    try {
      const text = await extractTextFromFile(f);
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: AI_PROMPT + text.slice(0, 8000),
        add_context_from_internet: false,
      });
      const jsonStr = raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
      const rows = JSON.parse(jsonStr);
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('Nenhuma transação encontrada.');
      setParsed(rows);
      setSelected(new Set(rows.map((_, i) => i)));
      setStep('preview');
    } catch (e) {
      setError(e.message?.includes('JSON') ? 'A IA não conseguiu interpretar o ficheiro. Tenta um formato mais estruturado.' : e.message);
      setStep('upload');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const toggleRow = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleSave = async () => {
    setStep('saving');
    const today = new Date().toISOString().split('T')[0];
    const toSave = parsed.filter((_, i) => selected.has(i)).map(t => ({
      title:          t.title || 'Sem título',
      type:           ['revenue','cost','investment','tax'].includes(t.type) ? t.type : 'cost',
      amount:         Math.abs(Number(t.amount) || 0),
      date:           t.date || today,
      category:       t.category || 'outro',
      notes:          t.notes || '',
      status:         'completed',
    }));
    for (const tx of toSave) {
      await base44.entities.BusinessTransaction.create(tx);
    }
    qc.invalidateQueries({ queryKey: ['business_transactions'] });
    setStep('done');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-600" />
            Importar Transações
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

          {/* Upload step */}
          {step === 'upload' && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-500">A IA vai ler o ficheiro e extrair automaticamente as transações.</p>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">Arrasta o ficheiro ou clica para selecionar</p>
                <p className="text-xs text-slate-400 mt-1">CSV, Excel (.xlsx) ou PDF</p>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Parsing */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">A IA está a analisar <span className="text-amber-700">{file?.name}</span>…</p>
              <p className="text-xs text-slate-400">Isto pode demorar alguns segundos</p>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">{parsed.length}</span> transações encontradas — seleciona as que queres importar
                </p>
                <button onClick={() => setSelected(selected.size === parsed.length ? new Set() : new Set(parsed.map((_, i) => i)))}
                  className="text-xs text-amber-700 hover:underline">
                  {selected.size === parsed.length ? 'Desselecionar tudo' : 'Selecionar tudo'}
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {parsed.map((t, i) => (
                  <div key={i} onClick={() => toggleRow(i)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selected.has(i) ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white opacity-50'
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                      selected.has(i) ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                    }`}>
                      {selected.has(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.date} · {t.category}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[t.type] || TYPE_COLORS.cost}`}>
                      {TYPE_LABELS[t.type] || t.type}
                    </span>
                    <span className="text-sm font-bold text-slate-700 shrink-0">€{Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={selected.size === 0}
                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                Importar {selected.size} transaç{selected.size === 1 ? 'ão' : 'ões'}
              </Button>
            </div>
          )}

          {/* Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-600 font-medium">A guardar transações…</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              <p className="text-lg font-semibold text-slate-800">Importação concluída!</p>
              <p className="text-sm text-slate-500">{selected.size} transaç{selected.size === 1 ? 'ão importada' : 'ões importadas'} com sucesso.</p>
              <Button onClick={handleClose} className="mt-2 px-8 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
