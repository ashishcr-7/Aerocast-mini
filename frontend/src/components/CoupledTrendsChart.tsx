import React, { useState } from 'react';
import type { WeatherRecord, PollutionObs } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Layers } from 'lucide-react';

interface CoupledTrendsChartProps {
  weather: WeatherRecord[];
  pollution: PollutionObs[];
  loading: boolean;
}

export const CoupledTrendsChart: React.FC<CoupledTrendsChartProps> = ({ weather, pollution, loading }) => {
  const [secondaryMetric, setSecondaryMetric] = useState<'blh' | 'wind' | 'humidity'>('blh');

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 p-6 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-400">Loading coupled meteorological data...</span>
      </div>
    );
  }

  // Combine weather and pollution by timestamp (last 48 hours)
  const pollutionMap = new Map<string, number>();
  for (const p of pollution) {
    if (p.pollutant === 'pm25') {
      const key = new Date(p.timestamp).toISOString().slice(0, 13);
      pollutionMap.set(key, p.value);
    }
  }

  const recentWeather = weather.slice(-48);
  const chartData = recentWeather.map((w) => {
    const time = new Date(w.timestamp);
    const key = time.toISOString().slice(0, 13);
    const pm25Val = pollutionMap.get(key) ?? null;

    return {
      timestamp: time,
      timeLabel: `${time.toLocaleDateString([], { weekday: 'short' })} ${time.getHours()}:00`,
      pm25: pm25Val,
      blh: w.boundaryLayerHeight,
      windSpeed: w.windSpeed,
      humidity: w.humidity,
      temperature: w.temperature,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs font-sans">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">
          {data.timeLabel}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-600 font-medium">PM2.5:</span>
            <span className="font-bold text-slate-900 font-mono">{data.pm25 != null ? `${data.pm25.toFixed(1)} µg/m³` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-600 font-medium">Mixing Ht (BLH):</span>
            <span className="font-bold text-slate-900 font-mono">{data.blh != null ? `${Math.round(data.blh)} m` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-cyan-600 font-medium">Wind Speed:</span>
            <span className="font-bold text-slate-900 font-mono">{data.windSpeed != null ? `${data.windSpeed.toFixed(1)} km/h` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-purple-600 font-medium">Relative Humidity:</span>
            <span className="font-bold text-slate-900 font-mono">{data.humidity != null ? `${Math.round(data.humidity)}%` : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const metricConfig = {
    blh: { label: 'Boundary Layer Ht (m)', color: '#4f46e5', dataKey: 'blh', unit: ' m' },
    wind: { label: 'Wind Speed (km/h)', color: '#0891b2', dataKey: 'windSpeed', unit: ' km/h' },
    humidity: { label: 'Relative Humidity (%)', color: '#9333ea', dataKey: 'humidity', unit: '%' },
  }[secondaryMetric];

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs flex flex-col gap-4">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Atmospheric Coupling: PM2.5 vs Meteorology (48h History)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Planetary boundary layer compression & calm winds driving surface pollution spikes
          </p>
        </div>

        {/* Secondary Variable Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <span className="text-slate-500 font-medium text-[11px] ml-1 mr-1">Couple with:</span>
          <button
            onClick={() => setSecondaryMetric('blh')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              secondaryMetric === 'blh' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mixing Height (BLH)
          </button>
          <button
            onClick={() => setSecondaryMetric('wind')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              secondaryMetric === 'wind' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wind Speed
          </button>
          <button
            onClick={() => setSecondaryMetric('humidity')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              secondaryMetric === 'humidity' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Humidity
          </button>
        </div>
      </div>

      {/* Dual Axis Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} interval={5} tickLine={false} />

            {/* Left Y-Axis: PM2.5 */}
            <YAxis
              yAxisId="left"
              stroke="#2563eb"
              fontSize={10}
              tickLine={false}
              unit=" µg"
              domain={[0, 'auto']}
            />

            {/* Right Y-Axis: Meteorology */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={metricConfig.color}
              fontSize={10}
              tickLine={false}
              unit={metricConfig.unit}
              domain={[0, 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pm25"
              name="PM2.5 (µg/m³)"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 2, fill: '#2563eb' }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey={metricConfig.dataKey}
              name={metricConfig.label}
              stroke={metricConfig.color}
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
