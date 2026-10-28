import React from 'react';
import type { Station } from '../types';
import { Activity, AlertTriangle, RefreshCw, Info, CloudRain, Cpu } from 'lucide-react';

interface HeaderProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenDisclaimer: () => void;
  onOpenEvaluation: () => void;
  aiConnected: boolean;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onRefresh,
  isRefreshing,
  onOpenDisclaimer,
  onOpenEvaluation,
  aiConnected,
  lastUpdated,
}) => {
  return (
    <header className="w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Academic Disclaimer Top Banner */}
      <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Academic & Research Prototype:</strong> Data-driven ML forecasting coupled with Open-Meteo ERA5 / GFS meteorology. Not a full 3D atmospheric chemistry transport model (WRF-Chem / CMAQ).
          </span>
        </div>
        <button
          onClick={onOpenDisclaimer}
          className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer shrink-0 ml-3"
        >
          View Scientific Notice
        </button>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <CloudRain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AeroCast <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Delhi NCR</span>
              </h1>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Weather-Coupled PM2.5 72h Machine Learning Forecasting System
            </p>
          </div>
        </div>

        {/* Right: Controls & Selectors */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Station Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Station:</span>
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-sm font-medium text-cyan-300 focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Status Pill */}
          <button
            onClick={onOpenEvaluation}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              aiConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/40'
            }`}
            title="View Model Performance & Benchmarks"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{aiConnected ? 'XGBoost v1.0 Online' : 'AI Offline'}</span>
          </button>

          {/* Model Evaluation Link */}
          <button
            onClick={onOpenEvaluation}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700/70 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Model Evaluation</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Refresh Data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* About / Info */}
          <button
            onClick={onOpenDisclaimer}
            className="p-1.5 rounded-lg border border-slate-700/70 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Methodology & Caveats"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
