import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PlanContext = createContext(null);

export const PLAN_INFO = {
  free_trial:   { name: 'Teste Gratuito', price: null,  color: 'slate',  badge: 'Grátis 2 meses' },
  premium:      { name: 'WisePremium',    price: 9.99,  color: 'blue',   badge: 'Mais popular' },
  premium_plus: { name: 'Premium Plus',   price: 13.99, color: 'violet', badge: 'IA Avançada' },
  business:     { name: 'Business',       price: 49.99, color: 'amber',  badge: 'Empresas' },
};

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function PlanProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setPlanLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me) return;
      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
      let p = profiles[0];

      if (p && !p.plan && localStorage.getItem('wisemoney_show_plans') !== 'true') {
        // Conta existente sem plano → auto-set free_trial com data de renovação
        const today = todayStr();
        const renewal = addMonths(today, 2);
        await base44.entities.UserProfile.update(p.id, {
          plan: 'free_trial',
          plan_started_at: today,
          plan_renewal_at: renewal,
        });
        p = { ...p, plan: 'free_trial', plan_started_at: today, plan_renewal_at: renewal };
      }

      setProfile(p || null);
    } catch (e) {
      console.error('PlanContext error:', e);
    } finally {
      setPlanLoading(false);
    }
  };

  const activatePlan = async (planId) => {
    const today = todayStr();
    // free_trial = 2 meses; planos pagos = 1 mês
    const renewalMonths = planId === 'free_trial' ? 2 : 1;
    const renewal = addMonths(today, renewalMonths);
    const me = await base44.auth.me();
    if (!me) return;
    let p;
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, {
        plan: planId,
        plan_started_at: today,
        plan_renewal_at: renewal,
        plan_ended_at: null,
        plan_cancelled_at: null,
      });
      p = { ...profile, plan: planId, plan_started_at: today, plan_renewal_at: renewal, plan_ended_at: null, plan_cancelled_at: null };
    } else {
      p = await base44.entities.UserProfile.create({
        total_xp: 0, current_level: 1, streak_days: 0,
        notifications_enabled: true,
        plan: planId,
        plan_started_at: today,
        plan_renewal_at: renewal,
      });
    }
    setProfile(p);
    localStorage.removeItem('wisemoney_show_plans');
  };

  const cancelSubscription = async () => {
    const today = todayStr();
    if (!profile) return;
    await base44.entities.UserProfile.update(profile.id, { plan_cancelled_at: today });
    setProfile(p => ({ ...p, plan_cancelled_at: today }));
  };

  // Contador diário em localStorage (não precisa de campo extra na BD)
  const getChatQuestionsLeft = () => {
    if (profile?.plan !== 'free_trial') return Infinity;
    const today = todayStr();
    const savedDate  = localStorage.getItem('wm_chat_date');
    const savedCount = parseInt(localStorage.getItem('wm_chat_count') || '0', 10);
    if (savedDate !== today) return 5;
    return Math.max(0, 5 - savedCount);
  };

  const useChatQuestion = () => {
    const today = todayStr();
    const savedDate  = localStorage.getItem('wm_chat_date');
    const savedCount = parseInt(localStorage.getItem('wm_chat_count') || '0', 10);
    const count = savedDate === today ? savedCount : 0;
    localStorage.setItem('wm_chat_date', today);
    localStorage.setItem('wm_chat_count', String(count + 1));
  };

  // ── Computadas ────────────────────────────────────────────────────
  const today = todayStr();

  // Período gratuito expirado
  const trialExpired = !!(
    profile?.plan === 'free_trial' &&
    profile?.plan_renewal_at &&
    today > profile.plan_renewal_at
  );

  // Subscrição cancelada E data de renovação já passou
  const subExpired = !!(
    profile?.plan_cancelled_at &&
    profile?.plan_renewal_at &&
    today > profile.plan_renewal_at
  );

  const planExpired = trialExpired || subExpired;

  // Se expirou, o plano efectivo é null
  const plan = planExpired ? null : (profile?.plan || null);

  // Subscrição está cancelada mas ainda dentro do período pago
  const isCancelled = !!(profile?.plan_cancelled_at && !planExpired);

  // Data de renovação formatada
  const renewalDate = profile?.plan_renewal_at || null;

  // Só mostra o plano grátis no primeiro registo (flag definida no Login)
  const showFreeTrial = !planLoading && localStorage.getItem('wisemoney_show_plans') === 'true';

  const needsPlanSelection = !planLoading && (
    (!profile?.plan && localStorage.getItem('wisemoney_show_plans') === 'true') ||
    planExpired
  );

  return (
    <PlanContext.Provider value={{
      plan,
      profile,
      planLoading,
      planExpired,
      isFreeTrial:   plan === 'free_trial',
      isPremium:     ['premium', 'premium_plus', 'business'].includes(plan),
      isPremiumPlus: ['premium_plus', 'business'].includes(plan),
      isBusiness:    plan === 'business',
      isCancelled,
      renewalDate,
      showFreeTrial,
      needsPlanSelection,
      activatePlan,
      cancelSubscription,
      getChatQuestionsLeft,
      useChatQuestion,
      reloadProfile: loadProfile,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
};
