import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, CreditCard, Smartphone, Building, X, Loader2, Wallet, ArrowLeft, Star, Zap, Users } from 'lucide-react';
import { usePlan } from '@/lib/PlanContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free_trial',
    name: 'Teste Gratuito',
    price: null,
    period: '2 meses',
    badge: null,
    icon: Wallet,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    border: 'border-slate-200',
    badgeBg: '',
    cta: 'Começar Grátis',
    ctaClass: 'bg-slate-700 hover:bg-slate-800 text-white',
    features: [
      { text: 'Dashboard completo', ok: true },
      { text: 'Registo de transações', ok: true },
      { text: 'Metas de poupança', ok: true },
      { text: 'Cursos financeiros', ok: true },
      { text: 'Estatísticas (bloqueadas)', ok: false },
      { text: 'Chat Finny (5 perguntas/dia)', ok: false },
    ],
  },
  {
    id: 'premium',
    name: 'WisePremium',
    price: 9.99,
    period: 'mês',
    badge: 'Mais popular',
    icon: Star,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    border: 'border-blue-500 ring-2 ring-blue-500/20',
    badgeBg: 'bg-blue-700',
    cta: 'Escolher Plano',
    ctaClass: 'bg-blue-700 hover:bg-blue-800 text-white',
    features: [
      { text: 'Tudo do Teste Gratuito', ok: true },
      { text: 'Estatísticas completas', ok: true },
      { text: 'Chat Finny ilimitado', ok: true },
      { text: 'Exportação de dados (Excel/PDF)', ok: true },
      { text: 'Integração bancária', ok: true },
      { text: 'Suporte prioritário', ok: true },
    ],
  },
  {
    id: 'premium_plus',
    name: 'Premium Plus',
    price: 13.99,
    period: 'mês',
    badge: 'IA Avançada',
    icon: Zap,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    border: 'border-violet-400 ring-2 ring-violet-400/20',
    badgeBg: 'bg-violet-600',
    cta: 'Escolher Plano',
    ctaClass: 'bg-violet-700 hover:bg-violet-800 text-white',
    features: [
      { text: 'Tudo do WisePremium', ok: true },
      { text: 'Finny agente IA pessoal', ok: true },
      { text: 'Análise de todas as transações', ok: true },
      { text: 'Conselhos financeiros personalizados', ok: true },
      { text: 'Alertas inteligentes de gastos', ok: true },
      { text: 'Relatórios automáticos mensais', ok: true },
    ],
  },
  {
    id: 'business',
    name: 'Business Package',
    price: 49.99,
    period: 'mês',
    badge: 'Empresas',
    icon: Users,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    border: 'border-amber-400 ring-2 ring-amber-400/20',
    badgeBg: 'bg-amber-600',
    cta: 'Escolher Plano',
    ctaClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    features: [
      { text: 'Tudo do Premium Plus', ok: true },
      { text: 'Gestão de equipas', ok: true },
      { text: 'Relatórios empresariais', ok: true },
      { text: 'Acesso API', ok: true },
      { text: 'Suporte dedicado 24/7', ok: true },
      { text: 'Onboarding personalizado', ok: true },
    ],
  },
];

function PaymentModal({ plan, onClose, onSuccess }) {
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // MB Way state
  const [phone, setPhone] = useState('');

  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, method === 'mbway' ? 3000 : method === 'card' ? 2000 : 500));
    setProcessing(false);
    setDone(true);
    await new Promise(r => setTimeout(r, 1200));
    onSuccess();
  };

  const methods = [
    { id: 'card',      label: 'Cartão',    icon: CreditCard },
    { id: 'mbway',     label: 'MB Way',    icon: Smartphone },
    { id: 'reference', label: 'Multibanco',icon: Building },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs">A subscrever</p>
            <p className="text-white font-bold text-lg">{plan.name}</p>
            <p className="text-blue-200 text-sm">€{plan.price}/mês</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-6 gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-800">Pagamento confirmado!</p>
              <p className="text-slate-500 text-sm text-center">O teu plano foi activado com sucesso.</p>
            </motion.div>
          ) : (
            <>
              {/* Method tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
                {methods.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${method === m.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Card */}
              {method === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Número do cartão</label>
                    <Input value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))}
                      placeholder="0000 0000 0000 0000" className="h-11 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Validade</label>
                      <Input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA" className="h-11 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">CVV</label>
                      <Input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                        placeholder="000" className="h-11 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nome no cartão</label>
                    <Input value={cardName} onChange={e => setCardName(e.target.value)}
                      placeholder="Nome completo" className="h-11 rounded-xl" />
                  </div>
                </div>
              )}

              {/* MB Way */}
              {method === 'mbway' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                    <Smartphone className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-amber-800">MB Way</p>
                    <p className="text-xs text-amber-600 mt-1">Introduz o teu número para receberes a notificação</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Número de telemóvel</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,9))}
                      placeholder="9XX XXX XXX" className="h-11 rounded-xl" />
                  </div>
                </div>
              )}

              {/* Multibanco */}
              {method === 'reference' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs text-slate-500 mb-3">Usa os seguintes dados no teu homebanking ou numa caixa multibanco:</p>
                    {[
                      ['Entidade', '21 348'],
                      ['Referência', '123 456 789'],
                      ['Montante', `€${plan.price}`],
                      ['Válido até', new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-PT')],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-blue-100 last:border-0">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-sm font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handlePay} disabled={processing}
                className="w-full h-12 rounded-xl mt-5 bg-blue-700 hover:bg-blue-800 text-white font-semibold">
                {processing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A processar...</>
                  : method === 'reference' ? 'Já efetuei o pagamento' : `Pagar €${plan.price}/mês`}
              </Button>

              <p className="text-center text-xs text-slate-400 mt-3">
                Pagamento simulado — sem cobrança real
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PlanSelection() {
  const { activatePlan, plan: currentPlan } = usePlan();
  const navigate = useNavigate();
  const [payingPlan, setPayingPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (plan) => {
    if (plan.id === 'free_trial') {
      setLoading(true);
      await activatePlan('free_trial');
      setLoading(false);
      toast.success('Bem-vindo ao Teste Gratuito!');
      navigate('/Dashboard');
    } else {
      setPayingPlan(plan);
    }
  };

  const handlePaymentSuccess = async () => {
    await activatePlan(payingPlan.id);
    setPayingPlan(null);
    toast.success(`Plano ${payingPlan.name} activado!`);
    navigate('/Dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex flex-col items-center justify-start py-10 px-4">

      {/* Back button (only when changing plan) */}
      {currentPlan && (
        <div className="w-full max-w-5xl mb-2">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          {currentPlan ? 'Mudar Plano' : 'Escolhe o teu Plano'}
        </h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">
          {currentPlan
            ? 'Seleciona o plano que melhor se adapta às tuas necessidades.'
            : 'Começa gratuitamente ou escolhe o plano que melhor se adapta a ti.'}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`relative bg-white rounded-2xl p-5 flex flex-col border-2 ${plan.border} ${isCurrent ? 'opacity-60' : ''}`}>

              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[11px] font-bold ${plan.badgeBg}`}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  Plano actual
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${plan.iconColor}`} />
              </div>

              <h3 className="font-bold text-slate-800 text-base mb-0.5">{plan.name}</h3>
              {plan.price ? (
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-extrabold text-slate-900">€{plan.price}</span>
                  <span className="text-slate-400 text-xs">/{plan.period}</span>
                </div>
              ) : (
                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-slate-900">Grátis</span>
                  <span className="text-slate-400 text-xs ml-1">por {plan.period}</span>
                </div>
              )}

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2">
                    {f.ok
                      ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      : <Lock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />}
                    <span className={`text-xs ${f.ok ? 'text-slate-700' : 'text-slate-400'}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Button onClick={() => !isCurrent && handleSelect(plan)}
                disabled={loading || isCurrent}
                className={`w-full h-10 rounded-xl text-sm font-semibold ${plan.ctaClass} disabled:opacity-50`}>
                {loading && plan.id === 'free_trial' ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? 'Plano actual' : plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-blue-300/60 text-xs mt-8 text-center">
        Podes mudar ou cancelar o teu plano a qualquer momento nas Definições.
      </p>

      {/* Payment modal */}
      <AnimatePresence>
        {payingPlan && (
          <PaymentModal
            plan={payingPlan}
            onClose={() => setPayingPlan(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
