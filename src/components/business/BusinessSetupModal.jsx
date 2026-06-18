import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Users, Loader2, Eye, EyeOff, CheckCircle, AtSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePlan } from '@/lib/PlanContext';
import { toast } from 'sonner';

export default function BusinessSetupModal({ isOpen, onClose, onComplete, onNeedPayment, defaultTab = 'create' }) {
  const { joinBusiness, setupBusiness } = usePlan();
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  // Create fields
  const [companyName, setCompanyName]         = useState('');
  const [companyUsername, setCompanyUsername] = useState('');
  const [myUsername, setMyUsername]           = useState('');
  const [myPassword, setMyPassword]           = useState('');

  // Join fields
  const [joinCompany, setJoinCompany]   = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  // Create tab: if parent handles payment (PlanSelection), pass data up; otherwise do it directly (gate case)
  const handleCreate = async () => {
    if (!companyName.trim() || !companyUsername.trim() || !myUsername.trim() || !myPassword.trim()) {
      return toast.error('Preenche todos os campos');
    }
    if (myPassword.length < 6) return toast.error('Password com mínimo 6 caracteres');
    if (onNeedPayment) {
      onNeedPayment({ companyName, companyUsername, myUsername, myPassword });
    } else {
      // Already on business plan (gate case) — create directly
      setLoading(true);
      try {
        await setupBusiness({ companyName, companyUsername, myUsername, myPassword });
        setDone(true);
        await new Promise(r => setTimeout(r, 1400));
        onComplete?.();
      } catch (e) {
        toast.error(e.message || 'Erro ao criar empresa');
      } finally {
        setLoading(false);
      }
    }
  };

  // Join tab: verify credentials and activate for free
  const handleJoin = async () => {
    if (!joinCompany.trim() || !joinUsername.trim() || !joinPassword.trim()) {
      return toast.error('Preenche todos os campos');
    }
    setLoading(true);
    try {
      await joinBusiness({ companyUsername: joinCompany, myUsername: joinUsername, myPassword: joinPassword });
      setDone(true);
      await new Promise(r => setTimeout(r, 1400));
      onComplete?.();
    } catch (e) {
      toast.error(e.message || 'Erro ao entrar na empresa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-y-auto max-h-[90vh]">

          {/* Header */}
          <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 px-5 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Configuração Business</p>
                  <p className="text-amber-200 text-[11px]">Área de trabalho empresarial</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {done ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </motion.div>
              <p className="text-lg font-bold text-slate-800">Pronto!</p>
              <p className="text-slate-500 text-sm text-center">
                {tab === 'create' ? 'Empresa criada! Bem-vindo ao Business.' : 'Joined com sucesso. Bem-vindo à equipa!'}
              </p>
            </div>
          ) : (
            <div className="p-5">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                <button onClick={() => setTab('create')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'create' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Building2 className="w-3.5 h-3.5" /> Criar Empresa
                </button>
                <button onClick={() => setTab('join')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'join' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Users className="w-3.5 h-3.5" /> Juntar-me
                </button>
              </div>

              {tab === 'create' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Cria a área de trabalho da tua empresa. Serás o administrador. Após preencher, prossegues para o pagamento.</p>
                  <div>
                    <Label className="text-xs mb-1 block">Nome da Empresa *</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="Ex: Empresa Lda" className="h-10 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Username da Empresa *</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input value={companyUsername} onChange={e => setCompanyUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="empresa-lda" className="h-10 rounded-xl pl-8" maxLength={30} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Identificador único (letras, números, - e _)</p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">O teu acesso pessoal</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mb-1 block">Username *</Label>
                        <Input value={myUsername} onChange={e => setMyUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                          placeholder="admin" className="h-10 rounded-xl" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Password *</Label>
                        <div className="relative">
                          <Input type={showPwd ? 'text' : 'password'} value={myPassword} onChange={e => setMyPassword(e.target.value)}
                            placeholder="Min. 6 chars" className="h-10 rounded-xl pr-8" />
                          <button type="button" onClick={() => setShowPwd(v => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={loading} className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold mt-1">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A criar...</> : onNeedPayment ? 'Continuar para Pagamento →' : 'Criar Empresa'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">A tua empresa já tem Business? Entra com as credenciais dadas pelo administrador. <span className="font-semibold text-emerald-600">Grátis para membros.</span></p>
                  <div>
                    <Label className="text-xs mb-1 block">Username da Empresa *</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input value={joinCompany} onChange={e => setJoinCompany(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="empresa-lda" className="h-10 rounded-xl pl-8" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">O teu Username *</Label>
                    <Input value={joinUsername} onChange={e => setJoinUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      placeholder="joao.silva" className="h-10 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">A tua Password *</Label>
                    <div className="relative">
                      <Input type={showPwd ? 'text' : 'password'} value={joinPassword} onChange={e => setJoinPassword(e.target.value)}
                        placeholder="Password da empresa" className="h-10 rounded-xl pr-8" />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleJoin} disabled={loading} className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold mt-1">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A verificar...</> : 'Entrar na Empresa'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
