import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStation } from '../context/StationContext';
import {
  LayoutDashboard,
  TrendingUp,
  Map,
  Activity,
  BarChart3,
  Database,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { aiConnected, lastUpdated } = useStation();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forecast', label: 'Forecast', icon: TrendingUp },
    { to: '/stations', label: 'Map', icon: Map },
    { to: '/trapping', label: 'Atmospheric Analysis', icon: Activity },
    { to: '/evaluation', label: 'Model Performance', icon: BarChart3 },
    { to: '/sources', label: 'Data Sources', icon: Database },
    { to: '/about', label: 'About', icon: Info },
  ];

  const dateObj = lastUpdated ? new Date(lastUpdated) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-slate-200/90 flex flex-col justify-between min-h-screen p-6 sticky top-0 h-screen select-none z-30 overflow-y-auto">
      <div>
        {/* Logo with comfortable margins */}
        <NavLink to="/" className="flex items-center gap-3.5 px-2 py-1 mb-8">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <svg
              className="h-6 w-6 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM12 18c-2.21 0-4-1.79-4-4 0-1.63 1.04-3.02 2.5-3.63V8c0-.55.45-1 1-1s1 .45 1 1v2.37c1.46.61 2.5 2 2.5 3.63 0 2.21-1.79 4-4 4z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              AeroCast
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              Delhi NCR Air Quality
            </p>
          </div>
        </NavLink>

        {/* Navigation links with generous flex gap and padding */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets with solid flex gap and generous padding */}
      <div className="flex flex-col gap-4 pt-6 mt-8 border-t border-slate-100">
        {/* Last Updated Pill Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Last Updated</span>
          </div>
          <div className="mt-1.5 font-bold text-slate-900 text-xs">
            Today, {dateStr}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {timeStr} (IST)
          </div>
        </div>

        {/* All Systems Online Card */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>All Systems Online</span>
          </div>

          <div className="flex flex-col gap-2 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Air Quality Data</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Weather Data</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>ML Model {aiConnected ? '(XGBoost)' : ''}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Database</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
