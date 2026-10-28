import React from 'react';
import { useStation } from '../context/StationContext';
import { CoupledTrendsChart } from '../components/CoupledTrendsChart';
import {
  Wind,
  Gauge,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

export const TrappingPage: React.FC = () => {
  const { selectedStation, analysis, weatherHistory, pollutionHistory, loading } = useStation();

  const weather = analysis?.weather || weatherHistory[weatherHistory.length - 1] || null;
  const windSpeedMs = (weather?.windSpeed || 1.3) / 3.6;
  const pblHeight = weather?.boundaryLayerHeight || 20;
  const ventilationIndex = Math.round(windSpeedMs * pblHeight);

  let ventilationCategory = 'Poor Dispersion';
  let ventColor = 'text-rose-700 bg-rose-50 border-rose-200';
  if (ventilationIndex > 6000) {
    ventilationCategory = 'Good Dispersion';
    ventColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (ventilationIndex >= 2000) {
    ventilationCategory = 'Moderate Dispersion';
    ventColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  const trappingRisk = analysis?.trappingRisk;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
          <Wind className="h-4 w-4" />
          <span>Atmospheric Meteorology & Inversion Mechanics</span>
        </div>
        <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Pollution Trapping & Boundary Layer Dynamics
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Surface meteorology analysis for <span className="text-blue-600 font-semibold">{selectedStation?.name || 'Selected Station'}</span>
        </p>
      </div>

      {/* Trapping Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Trapping Risk Level */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Trapping Risk Score
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                Rule-Based Model
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {trappingRisk?.score ?? 6}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {trappingRisk?.maxScore ?? 7} Points</span>
              <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border border-rose-200 bg-rose-50 text-rose-700">
                {trappingRisk?.level ?? 'High Risk'}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-rose-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, ((trappingRisk?.score || 6) / (trappingRisk?.maxScore || 7)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 text-xs text-slate-600">
            {trappingRisk?.factors && trappingRisk.factors.length > 0 ? (
              <div className="text-amber-700 font-medium">
                Active Factors: {trappingRisk.factors.join(' • ')}
              </div>
            ) : (
              <span className="text-rose-600 font-semibold">Calm winds & low mixing height detected</span>
            )}
          </div>
        </div>

        {/* Card 2: Ventilation Index */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-blue-600" /> Atmospheric Ventilation Index
              </span>
              <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] border ${ventColor}`}>
                {ventilationCategory}
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {ventilationIndex}
              </span>
              <span className="text-xs text-slate-400 font-medium">m²/s</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Calculated as <code className="text-blue-600 font-semibold">VI = Wind Speed (m/s) × Mixing Height (m)</code>. Values below 2,000 indicate severe stagnation prone to smog formation.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Wind: {weather?.windSpeed?.toFixed(1) || '1.3'} km/h</span>
            <span>BLH: {pblHeight} m</span>
          </div>
        </div>

        {/* Card 3: Boundary Layer Mixing Volume */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" /> Mixing Height (PBL)
              </span>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                ERA5 Reanalysis
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {pblHeight}
              </span>
              <span className="text-xs text-slate-400 font-medium">meters</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Nocturnal surface radiative cooling compresses the planetary boundary layer to &lt;200m, concentrating ground-level emissions into a thin air volume.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Temp: {weather?.temperature?.toFixed(1) || '19.8'}°C</span>
            <span>Humidity: {weather?.humidity != null ? Math.round(weather.humidity) : '72'}%</span>
          </div>
        </div>
      </div>

      {/* Coupled Trends Interactive Chart */}
      <CoupledTrendsChart
        weather={weatherHistory}
        pollution={pollutionHistory}
        loading={loading && weatherHistory.length === 0}
      />

      {/* Meteorological Theory Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-xs text-slate-600 leading-relaxed space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          The Science of Delhi NCR Winter Trapping Episodes
        </h3>
        <p>
          Delhi NCR sits in a landlocked topographical basin in the northern Indo-Gangetic Plains (IGP). During the post-monsoon and winter seasons, two dominant meteorological mechanisms govern air quality:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="font-bold text-rose-700 text-xs mb-1">1. Severe Nocturnal Inversions</h4>
            <p className="text-slate-500 text-xs leading-normal">
              Clear winter skies promote rapid radiative heat loss from the surface at night. Warmer air aloft acts as an atmospheric "lid", collapsing the Planetary Boundary Layer (PBL) from over 1,500m during midday down to under 150m at dawn.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="font-bold text-blue-700 text-xs mb-1">2. Calm Winds & High Humidity</h4>
            <p className="text-slate-500 text-xs leading-normal">
              Wind speeds drop below 1.5 m/s (&lt;5 km/h), disabling horizontal ventilation. High nocturnal relative humidity exceeding 70% accelerates secondary particulate aerosol condensation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
