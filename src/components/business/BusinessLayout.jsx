import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Settings, BarChart3, Users, Wallet, Target, LayoutDashboard, Trophy } from 'lucide-react';
import BusinessBottomTabBar from './BusinessBottomTabBar';

const NAV_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/BusinessDashboard' },
  { icon: Wallet,          label: 'Transações', path: '/BusinessTransactions' },
  { icon: Target,          label: 'KPIs',       path: '/BusinessKPIs' },
  { icon: Users,           label: 'Equipa',     path: '/BusinessEmployees' },
  { icon: BarChart3,       label: 'Análise',    path: '/BusinessStats' },
  { icon: Trophy,          label: 'Conquistas', path: '/BusinessAchievements' },
];

export default function BusinessLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">WiseMoney <span className="text-amber-600">Business</span></span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden min-[800px]:flex items-center gap-1">
            {NAV_LINKS.map(({ icon: Icon, label, path }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button onClick={() => navigate('/Settings')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 min-[800px]:pb-8">
        {children}
      </main>

      <BusinessBottomTabBar />
    </div>
  );
}
