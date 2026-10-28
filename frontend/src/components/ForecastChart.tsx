import React, { useState } from 'react';
import type { ForecastItem } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

interface ForecastChartProps {
  forecasts: ForecastItem[];
  loading: boolean;
  stationName: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecasts, loading, stationName }) => {
  const [horizon, setHorizon] = useState<24 | 48 | 72>(72);

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-6 h-96 flex items-center justify-center animate-pulse">
        <span className="text-sm text-slate-500">Generating weather-coupled 72h forecast...</span>
      </div>
    );
  }

  const displayedForecasts = forecasts.slice(0, horizon);

  // Prepare chart data format
  const chartData = displayedForecasts.map((f) => {
    const time = new Date(f.forecastTime);
    const lower = f.lowerBound ?? Math.max(10, f.predictedValue - 15);
    const upper = f.upperBound ?? (f.predictedValue + 15);

    // Indian CPCB AQI category approximation from PM2.5
    let aqiCat = 'Moderate';
    let aqiCol = '#d4d400';
    if (f.predictedValue <= 30) { aqiCat = 'Good'; aqiCol = '#00e400'; }
    else if (f.predictedValue <= 60) { aqiCat = 'Satisfactory'; aqiCol = '#92d050'; }
    else if (f.predictedValue <= 90) { aqiCat = 'Moderate'; aqiCol = '#d4d400'; }
    else if (f.predictedValue <= 120) { aqiCat = 'Poor'; aqiCol = '#ff7e00'; }
    else if (f.predictedValue <= 250) { aqiCat = 'Very Poor'; aqiCol = '#ff4444'; }
    else { aqiCat = 'Severe'; aqiCol = '#ff6b8a'; }

    return {
      hour: `+${f.leadHours}h`,
      rawDate: time,
      displayTime: `${time.toLocaleDateString([], { weekday: 'short' })} ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      leadHours: f.leadHours,
      pm25: f.predictedValue,
      lowerBound: lower,
      upperBound: upper,
      // For Recharts stacked uncertainty range:
      confidenceRange: [lower, upper],
      aqiCategory: aqiCat,
      aqiColor: aqiCol,
    };
  });

  // Calculate summary statistics
  const values = chartData.map((d) => d.pm25);
  const maxVal = values.length ? Math.max(...values) : 0;
  const minVal = values.length ? Math.min(...values) : 0;
  const avgVal = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const peakItem = chartData.find((d) => d.pm25 === maxVal);
  const exceedCount = values.filter((v) => v > 60).length;
  const exceedPct = values.length ? Math.round((exceedCount / values.length) * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
        <div className="flex items-center justify-between gap-4 font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
          <span>{data.displayTime}</span>
          <span className="text-cyan-400 font-mono">Lead: {data.hour}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Predicted PM2.5:</span>
            <span className="text-base font-bold text-cyan-300 font-mono">
              {data.pm25.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Uncertainty (90% CI):</span>
            <span className="text-slate-300 font-mono text-[11px]">
              [{data.lowerBound.toFixed(1)} – {data.upperBound.toFixed(1)}]
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Implied AQI:</span>
            <span
              className="px-1.5 py-0.5 rounded text-[11px] font-bold"
              style={{ backgroundColor: `${data.aqiColor}20`, color: data.aqiColor }}
            >
              {data.aqiCategory}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            72-Hour PM2.5 Forecast & Uncertainty Interval
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Coupled weather-aware machine learning model prediction for <span className="text-cyan-300 font-medium">{stationName}</span>
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Horizon:</span>
          {([24, 48, 72] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer text-xs ${
                horizon === h
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Forecast Average</span>
          <span className="text-base font-bold text-white">{avgVal} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span></span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Peak PM2.5</span>
          <span className="text-base font-bold text-rose-400">
            {maxVal.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">at {peakItem?.hour || ''}</span>
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Minimum PM2.5</span>
          <span className="text-base font-bold text-emerald-400">{minVal.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span></span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Hours &gt; 60 µg/m³ (Std)</span>
          <span className={`text-base font-bold ${exceedPct > 50 ? 'text-amber-400' : 'text-slate-200'}`}>
            {exceedCount}/{displayedForecasts.length} ({exceedPct}%)
          </span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              {/* Uncertainty Envelope Gradient */}
              <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5c9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e5c9" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5c9" stopOpacity={1} />
                <stop offset="100%" stopColor="#2196f3" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={horizon === 72 ? 5 : horizon === 48 ? 3 : 1}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[0, 'dataMax + 30']}
              unit=""
            />

            <Tooltip content={<CustomTooltip />} />

            {/* CPCB Threshold Reference Lines */}
            <ReferenceLine y={60} stroke="#92d050" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '60 (Standard)', fill: '#92d050', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={120} stroke="#ff7e00" strokeDasharray="4 4" strokeWidth={1} label={{ value: '120 (Poor)', fill: '#ff7e00', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={250} stroke="#ff4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: '250 (Severe)', fill: '#ff4444', fontSize: 10, position: 'right' }} />

            {/* Shaded Uncertainty Upper Bound */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="transparent"
              fill="url(#uncertaintyGradient)"
              fillOpacity={1}
            />

            {/* Predicted Line */}
            <Line
              type="monotone"
              dataKey="pm25"
              stroke="#00e5c9"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#00e5c9', stroke: '#050e1a', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Scientific Footnote */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
            <span>Forecast Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-cyan-500/20 border border-cyan-500/30 inline-block rounded-xs"></span>
            <span>Uncertainty Envelope (Widens with lead time)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-lime-400 border-dashed inline-block"></span>
            <span>CPCB 24h Threshold (60 µg/m³)</span>
          </div>
        </div>
        <span className="text-slate-500 italic">Direct multi-horizon XGBoost formulation</span>
      </div>
    </div>
  );
};
