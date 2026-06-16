import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PlanContext = createContext(null);

export const PLAN_INFO = {
  free_trial:   { name: 'Teste Gratuito', price: null,  color: 'slate',  badge: 'Grátis 2 meses' },
  premium:      { name: 'WisePremium',    price: 9.99,  color: 'blue',   badge: 'Mais popular' },
  premium_plus: { name: 'Premium Plus',   price: 13.99, color: 'violet', badge: 'IA Avançada' },
  business:     { name: 'Business',       price: 49.99, color: 'amber',  badge: 'Empresas' },
};

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
        // Conta existente sem plano → auto-set free_trial
        const today = new Date().toISOString().split('T')[0];
        await base44.entities.UserProfile.update(p.id, { plan: 'free_trial', plan_started_at: today });
        p = { ...p, plan: 'free_trial', plan_started_at: today };
      }
      setProfile(p || null);
    } catch (e) {
      console.error('PlanContext error:', e);
    } finally {
      setPlanLoading(false);
    }
  };

  const activatePlan = async (plan) => {
    const today = new Date().toISOString().split('T')[0];
    const me = await base44.auth.me();
    if (!me) return;
    let p;
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { plan, plan_started_at: today, plan_ended_at: null });
      p = { ...profile, plan, plan_started_at: today, plan_ended_at: null };
    } else {
      p = await base44.entities.UserProfile.create({
        total_xp: 0, current_level: 1, streak_days: 0,
        notifications_enabled: true,
        plan, plan_started_at: today,
      });
    }
    setProfile(p);
    localStorage.removeItem('wisemoney_show_plans');
  };

  // Contador diário em localStorage (não precisa de campo extra na BD)
  const getChatQuestionsLeft = () => {
    if (profile?.plan !== 'free_trial') return Infinity;
    const today = new Date().toISOString().split('T')[0];
    const savedDate  = localStorage.getItem('wm_chat_date');
    const savedCount = parseInt(localStorage.getItem('wm_chat_count') || '0', 10);
    if (savedDate !== today) return 5;
    return Math.max(0, 5 - savedCount);
  };

  const useChatQuestion = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate  = localStorage.getItem('wm_chat_date');
    const savedCount = parseInt(localStorage.getItem('wm_chat_count') || '0', 10);
    const count = savedDate === today ? savedCount : 0;
    localStorage.setItem('wm_chat_date', today);
    localStorage.setItem('wm_chat_count', String(count + 1));
  };

  const plan = profile?.plan || null;
  const needsPlanSelection = !planLoading && !plan && localStorage.getItem('wisemoney_show_plans') === 'true';

  return (
    <PlanContext.Provider value={{
      plan,
      profile,
      planLoading,
      isFreeTrial:   plan === 'free_trial',
      isPremium:     ['premium', 'premium_plus', 'business'].includes(plan),
      isPremiumPlus: ['premium_plus', 'business'].includes(plan),
      needsPlanSelection,
      activatePlan,
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
