import React from 'react';
import { useStation } from '../context/StationContext';
import { MapPin, ChevronDown, Calendar } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    stations,
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    horizon,
    setHorizon,
    lastUpdated,
  } = useStation();

  // Current or updated formatted date & time
  const dateObj = lastUpdated ? new Date(lastUpdated) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header className="flex flex-wrap items-center justify-between gap-6 mb-8 w-full">
      {/* 1. Station Selector Card with generous padding */}
      <div className="relative group bg-white border border-slate-200/90 rounded-2xl px-5 py-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer min-w-[240px]">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1 leading-tight">
              {selectedStation?.name || 'Select Station'}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              {selectedStation?.city || 'Delhi NCR'}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </div>

        {/* Real select overlay */}
        <select
          value={selectedStationId}
          onChange={(e) => setSelectedStationId(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
          aria-label="Change station"
        >
          {stations.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} — {st.city}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Middle & Right: Horizon Switcher + Date Pill + Avatar with generous gaps */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Horizon selector */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 flex items-center gap-1 shadow-xs">
          {([24, 48, 72] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                horizon === h
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>

        {/* Date / Time Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2 flex items-center gap-3 text-xs shadow-xs text-slate-700">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="leading-tight">
            <div className="font-bold text-slate-900 text-xs">{dateFormatted}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{timeFormatted} (IST)</div>
          </div>
        </div>

        {/* User Profile Avatar */}
        <div className="h-10 w-10 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 font-black flex items-center justify-center text-sm shadow-xs select-none shrink-0">
          A
        </div>
      </div>
    </header>
  );
};
