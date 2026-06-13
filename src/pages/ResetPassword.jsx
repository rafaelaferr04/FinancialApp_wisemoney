import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/localDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
      isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }`}>
      {isError
        ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase detects the token in the URL hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
      }
    });

    // Also check if there's already an active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setFeedback({ type: 'error', message: 'As passwords não coincidem.' });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'A password deve ter pelo menos 6 caracteres.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Password atualizada! A entrar na tua conta...' });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm text-white mb-4 shadow-xl">
          <Wallet className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">WiseMoney</h1>
        <p className="text-white/70 text-sm">Gere as tuas finanças com inteligência</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 mx-auto mb-4">
          <KeyRound className="w-6 h-6 text-blue-700" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">Nova password</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          {ready ? 'Escolhe uma nova password para a tua conta.' : 'A verificar o link…'}
        </p>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-700">Nova password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-12 rounded-xl border-slate-200"
                required
                minLength={6}
                autoFocus
              />
            </div>
            <div>
              <Label className="text-slate-700">Confirmar password</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-12 rounded-xl border-slate-200"
                required
                minLength={6}
              />
            </div>
            <Alert type={feedback?.type} message={feedback?.message} />
            <Button
              type="submit"
              disabled={loading || feedback?.type === 'success'}
              className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : 'Guardar nova password'}
            </Button>
          </form>
        ) : (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
