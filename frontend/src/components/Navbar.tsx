import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStation } from '../context/StationContext';
import {
  CloudRain,
  Activity,
  TrendingUp,
  Wind,
  MapPin,
  BarChart3,
  Info,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    stations,
    selectedStationId,
    setSelectedStationId,
    refresh,
    isRefreshing,
    aiConnected,
  } = useStation();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/forecast', label: '72h Forecast', icon: TrendingUp },
    { to: '/trapping', label: 'Atmospheric Trapping', icon: Wind },
    { to: '/stations', label: 'NCR Network', icon: MapPin },
    { to: '/evaluation', label: 'Model Benchmarks', icon: BarChart3 },
    { to: '/about', label: 'Scientific Notice', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Top Academic Notice Bar */}
      <div className="border-b border-amber-500/20 bg-amber-950/30 px-4 py-1.5 text-xs text-amber-200/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-medium sm:text-xs">
              <strong className="text-amber-300">Weather-Coupled ML Prototype:</strong> Statistical XGBoost forecasting with ERA5/GFS boundary layer dynamics.
            </span>
          </div>
          <NavLink
            to="/about"
            className="shrink-0 text-[11px] font-medium text-cyan-400 underline hover:text-cyan-300 sm:text-xs"
          >
            Scientific Disclaimers &rarr;
          </NavLink>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/60 transition-colors">
            <CloudRain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">AeroCast</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                Delhi NCR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">72-Hour PM2.5 Weather-Coupled ML</p>
          </div>
        </NavLink>

        {/* Global Controls: Station Selector + Status + Refresh */}
        <div className="flex items-center gap-2.5">
          {/* Station Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs shadow-inner">
            <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-cyan-200 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
              aria-label="Select Delhi NCR station"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* AI Connection Pill */}
          <div
            className={`hidden md:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
              aiConnected
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/40 text-rose-300'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>{aiConnected ? 'XGBoost Active' : 'AI Offline'}</span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh current station data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Navigation Links Bar */}
      <nav className="border-t border-slate-800/60 bg-slate-950/40 px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
