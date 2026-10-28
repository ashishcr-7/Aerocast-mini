import React from 'react';
import type { TrappingAnalysisResponse, WeatherRecord } from '../types';
import { Wind, Droplets, Thermometer, Compass, Gauge, AlertCircle, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KeyMetricsProps {
  analysis: TrappingAnalysisResponse | null;
  weather: WeatherRecord | null;
  loading: boolean;
}

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ analysis, weather, loading }) => {
  if (loading || !analysis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-xl bg-slate-900/60 border border-slate-800" />
        ))}
      </div>
    );
  }

  const { currentAqi, latestPm25, trappingRisk } = analysis;
  const pm25Value = latestPm25?.value ?? 0;
  const aqiValue = currentAqi?.aqi ?? 0;
  const aqiCategory = currentAqi?.category ?? 'Moderate';
  const aqiColor = currentAqi?.color ?? '#ffff00';

  // Ventilation Index = windSpeed (m/s) * PBL height (m)
  // windSpeed is in km/h, convert to m/s by dividing by 3.6
  const windSpeedMs = (weather?.windSpeed || 0) / 3.6;
  const pblHeight = weather?.boundaryLayerHeight || 400;
  const ventilationIndex = Math.round(windSpeedMs * pblHeight);

  // Ventilation status: <2000 poor, 2000-6000 moderate, >6000 good dispersion
  let ventilationCategory = 'Poor Dispersion';
  let ventColor = 'text-rose-400';
  if (ventilationIndex > 6000) {
    ventilationCategory = 'Good Dispersion';
    ventColor = 'text-emerald-400';
  } else if (ventilationIndex >= 2000) {
    ventilationCategory = 'Moderate Dispersion';
    ventColor = 'text-amber-400';
  }

  // Trapping badge styling
  const trappingBadgeStyles = {
    low: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Low Trapping' },
    moderate: { bg: 'bg-yellow-950/40', text: 'text-yellow-400', border: 'border-yellow-500/40', label: 'Moderate Trapping' },
    high: { bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-500/40', label: 'High Trapping' },
    extreme: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-500/40', label: 'Extreme Trapping' },
  }[trappingRisk?.level || 'low'];

  // CPCB Health Advisory
  const healthAdvisories: Record<string, string> = {
    'Good': 'Air quality is satisfactory; air pollution poses little or no risk.',
    'Satisfactory': 'Minor breathing discomfort to sensitive people.',
    'Moderate': 'Breathing discomfort to people with lungs, asthma and heart diseases.',
    'Poor': 'Breathing discomfort to most people on prolonged exposure.',
    'Very Poor': 'Respiratory illness on prolonged exposure. Pronounced effect on lung and heart patients.',
    'Severe': 'Respiratory effects even on healthy people and serious health impacts on those with diseases.',
  };

  const getWindDirectionCardinal = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round((deg % 360) / 22.5) % 16;
    return directions[idx];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Current PM2.5 Observation Card */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-cyan-300">
            <Gauge className="w-4 h-4 text-cyan-400" /> Current PM2.5
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
            CPCB Std: 60 µg/m³
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {pm25Value.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-slate-400">µg/m³</span>
          <div className="ml-auto flex items-center text-xs font-semibold">
            {pm25Value > 60 ? (
              <span className="flex items-center text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> {(pm25Value / 60).toFixed(1)}x Std
              </span>
            ) : (
              <span className="flex items-center text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Within Std
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Observed: {latestPm25?.timestamp ? new Date(latestPm25.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
          <span className="text-slate-500">Continuous Monitoring</span>
        </div>
      </div>

      {/* 2. Indian CPCB AQI Card */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 shadow-lg flex flex-col justify-between backdrop-blur-sm relative">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Indian CPCB AQI
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-bold border"
            style={{
              backgroundColor: `${aqiColor}20`,
              color: aqiColor,
              borderColor: `${aqiColor}50`,
            }}
          >
            {aqiCategory}
          </span>
        </div>

        <div className="my-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight" style={{ color: aqiColor }}>
            {aqiValue}
          </span>
          <span className="text-xs text-slate-400 font-medium">/ 500 Index</span>
        </div>

        <p className="text-[11px] text-slate-300 line-clamp-2 border-t border-slate-800/80 pt-2 leading-tight">
          {healthAdvisories[aqiCategory] || 'Air quality guidelines apply.'}
        </p>
      </div>

      {/* 3. Atmospheric Trapping Risk Indicator */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 shadow-lg flex flex-col justify-between backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-purple-300">
            <AlertCircle className="w-4 h-4 text-purple-400" /> Trapping Risk
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${trappingBadgeStyles.bg} ${trappingBadgeStyles.text} ${trappingBadgeStyles.border}`}>
            {trappingBadgeStyles.label}
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Risk Score: {trappingRisk?.score || 0}/{trappingRisk?.maxScore || 7}</span>
            <span className="text-[11px] text-slate-400">Rule-based model</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                trappingRisk?.level === 'extreme' ? 'bg-rose-500' :
                trappingRisk?.level === 'high' ? 'bg-orange-500' :
                trappingRisk?.level === 'moderate' ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, ((trappingRisk?.score || 1) / (trappingRisk?.maxScore || 7)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex flex-col gap-0.5">
          {trappingRisk?.factors && trappingRisk.factors.length > 0 ? (
            <span className="text-amber-300/90 truncate">
              ⚠️ {trappingRisk.factors.join(', ')}
            </span>
          ) : (
            <span className="text-emerald-400/90">Good dispersion meteorological conditions</span>
          )}
        </div>
      </div>

      {/* 4. Weather & Boundary Layer Coupling Card */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 shadow-lg flex flex-col justify-between backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-blue-300">
            <Wind className="w-4 h-4 text-blue-400" /> Boundary Layer & Wind
          </span>
          <span className={`text-[11px] font-semibold ${ventColor}`}>
            {ventilationCategory}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-2 text-xs">
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800/70">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Wind className="w-3 h-3 text-cyan-400" /> Wind
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {weather?.windSpeed?.toFixed(1) || '--'} <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Compass className="w-2.5 h-2.5" />
              {weather?.windDirection != null ? `${getWindDirectionCardinal(weather.windDirection)} (${Math.round(weather.windDirection)}°)` : '--'}
            </div>
          </div>

          <div className="bg-slate-950/50 p-2 rounded border border-slate-800/70">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Gauge className="w-3 h-3 text-indigo-400" /> Mixing Ht (BLH)
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {weather?.boundaryLayerHeight != null ? Math.round(weather.boundaryLayerHeight) : '--'} <span className="text-[10px] font-normal text-slate-400">m</span>
            </div>
            <div className="text-[10px] text-slate-400">
              VI: {ventilationIndex} m²/s
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-rose-400" /> {weather?.temperature?.toFixed(1) || '--'}°C
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-sky-400" /> {weather?.humidity != null ? Math.round(weather.humidity) : '--'}% RH
          </span>
          <span className="text-[10px] text-slate-500">ERA5 / GFS</span>
        </div>
      </div>
    </div>
  );
};
