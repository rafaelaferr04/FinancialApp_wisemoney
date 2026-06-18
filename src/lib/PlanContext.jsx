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

export async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PlanProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [businessAccount, setBusinessAccount] = useState(null);
  const [businessMember, setBusinessMember] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setPlanLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me) return;

      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
      let p = profiles[0];

      if (p && !p.plan && localStorage.getItem('wisemoney_show_plans') !== 'true') {
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

      // Load business membership if business plan
      if (p?.plan === 'business') {
        try {
          const members = await base44.entities.BusinessMember.filter({ member_email: me.email, is_active: true });
          const member = members[0] || null;
          setBusinessMember(member);
          if (member?.business_id) {
            localStorage.setItem('wm_business_id', member.business_id);
            const accounts = await base44.entities.BusinessAccount.filter({ id: member.business_id });
            setBusinessAccount(accounts[0] || null);
          }
        } catch (e) {
          // business tables may not exist yet
        }
      }
    } catch (e) {
      console.error('PlanContext error:', e);
    } finally {
      setPlanLoading(false);
    }
  };

  const activatePlan = async (planId) => {
    const today = todayStr();
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

  // Create a new business workspace (admin flow)
  const setupBusiness = async ({ companyName, companyUsername, myUsername, myPassword }) => {
    const me = await base44.auth.me();
    if (!me) throw new Error('Não autenticado');

    const pwdHash = await hashPassword(myPassword);

    // Create business account
    const account = await base44.entities.BusinessAccount.create({
      company_name: companyName,
      company_username: companyUsername.toLowerCase().replace(/\s/g, '_'),
      owner_email: me.email,
    });

    // Create admin member record
    const member = await base44.entities.BusinessMember.create({
      business_id: account.id,
      member_username: myUsername,
      member_password: pwdHash,
      member_email: me.email,
      role: 'admin',
      display_name: me.full_name || myUsername,
      is_active: true,
    });

    localStorage.setItem('wm_business_id', account.id);
    setBusinessAccount(account);
    setBusinessMember(member);

    await activatePlan('business');
    return account;
  };

  // Join an existing business workspace (employee flow)
  const joinBusiness = async ({ companyUsername, myUsername, myPassword }) => {
    const me = await base44.auth.me();
    if (!me) throw new Error('Não autenticado');

    const pwdHash = await hashPassword(myPassword);

    // Find business account
    const accounts = await base44.entities.BusinessAccount.filter({ company_username: companyUsername.toLowerCase() });
    if (!accounts.length) throw new Error('Empresa não encontrada. Verifica o username.');

    const account = accounts[0];

    // Find matching member record
    const members = await base44.entities.BusinessMember.filter({
      business_id: account.id,
      member_username: myUsername,
      member_password: pwdHash,
      is_active: true,
    });

    if (!members.length) throw new Error('Credenciais inválidas. Pede ao administrador para verificar.');

    const member = members[0];

    // Link this WiseMoney account to the member record
    if (member.member_email && member.member_email !== me.email) {
      throw new Error('Este utilizador já está associado a outra conta WiseMoney.');
    }

    await base44.entities.BusinessMember.update(member.id, { member_email: me.email });

    localStorage.setItem('wm_business_id', account.id);
    setBusinessAccount(account);
    setBusinessMember({ ...member, member_email: me.email });

    await activatePlan('business');
    return account;
  };

  const cancelSubscription = async () => {
    const today = todayStr();
    if (!profile) return;
    await base44.entities.UserProfile.update(profile.id, { plan_cancelled_at: today });
    setProfile(p => ({ ...p, plan_cancelled_at: today }));
  };

  const reactivateSubscription = async () => {
    if (!profile) return;
    await base44.entities.UserProfile.update(profile.id, { plan_cancelled_at: null });
    setProfile(p => ({ ...p, plan_cancelled_at: null }));
  };

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

  const today = todayStr();

  const trialExpired = !!(
    profile?.plan === 'free_trial' &&
    profile?.plan_renewal_at &&
    today > profile.plan_renewal_at
  );

  const subExpired = !!(
    profile?.plan_cancelled_at &&
    profile?.plan_renewal_at &&
    today > profile.plan_renewal_at
  );

  const planExpired = trialExpired || subExpired;
  const plan = planExpired ? null : (profile?.plan || null);
  const isCancelled = !!(profile?.plan_cancelled_at && !planExpired);

  const renewalDate = profile?.plan_renewal_at ||
    (profile?.plan_started_at
      ? addMonths(profile.plan_started_at, profile.plan === 'free_trial' ? 2 : 1)
      : null);

  const showFreeTrial = !planLoading && localStorage.getItem('wisemoney_show_plans') === 'true';

  const needsPlanSelection = !planLoading && (
    (!profile?.plan && localStorage.getItem('wisemoney_show_plans') === 'true') ||
    planExpired
  );

  const businessId = businessMember?.business_id || localStorage.getItem('wm_business_id') || null;
  const isBusinessAdmin = businessMember?.role === 'admin';

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
      // Business workspace
      businessId,
      businessAccount,
      businessMember,
      isBusinessAdmin,
      needsBusinessSetup: plan === 'business' && !businessId,
      // Actions
      activatePlan,
      setupBusiness,
      joinBusiness,
      cancelSubscription,
      reactivateSubscription,
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
