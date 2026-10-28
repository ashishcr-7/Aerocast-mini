import React, { useState } from 'react';
import { useStation } from '../context/StationContext';
import {
  TrendingUp,
  Clock,
  Layers,
  Table as TableIcon,
  Download,
} from 'lucide-react';
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

export const ForecastPage: React.FC = () => {
  const { selectedStation, forecasts, horizon, setHorizon } = useStation();
  const [tableFilter, setTableFilter] = useState<'all' | 'high'>('all');

  const displayedForecasts = forecasts.slice(0, horizon);

  // Prepare chart data format
  const chartData = displayedForecasts.map((f) => {
    const time = new Date(f.forecastTime);
    const lower = f.lowerBound ?? Math.max(10, f.predictedValue - 20);
    const upper = f.upperBound ?? (f.predictedValue + 25);

    let aqiCat = 'Moderate';
    let aqiCol = '#f59e0b';
    let aqiBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (f.predictedValue <= 30) {
      aqiCat = 'Good'; aqiCol = '#10b981'; aqiBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (f.predictedValue <= 60) {
      aqiCat = 'Satisfactory'; aqiCol = '#10b981'; aqiBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (f.predictedValue <= 90) {
      aqiCat = 'Moderate'; aqiCol = '#f59e0b'; aqiBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else if (f.predictedValue <= 120) {
      aqiCat = 'Poor'; aqiCol = '#f97316'; aqiBg = 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (f.predictedValue <= 250) {
      aqiCat = 'Very Poor'; aqiCol = '#ef4444'; aqiBg = 'bg-rose-50 text-rose-700 border-rose-200';
    } else {
      aqiCat = 'Severe'; aqiCol = '#9333ea'; aqiBg = 'bg-purple-50 text-purple-700 border-purple-200';
    }

    return {
      hour: `+${f.leadHours}h`,
      rawDate: time,
      displayTime: `${time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      leadHours: f.leadHours,
      pm25: f.predictedValue,
      lowerBound: lower,
      upperBound: upper,
      aqiCategory: aqiCat,
      aqiColor: aqiCol,
      aqiBg,
    };
  });

  // Calculate summary metrics
  const values = chartData.map((d) => d.pm25);
  const maxVal = values.length ? Math.max(...values) : 0;
  const minVal = values.length ? Math.min(...values) : 0;
  const avgVal = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const peakItem = chartData.find((d) => d.pm25 === maxVal);
  const exceedCount = values.filter((v) => v > 60).length;
  const exceedPct = values.length ? Math.round((exceedCount / values.length) * 100) : 0;

  // Filtered table rows
  const tableData = tableFilter === 'high' ? chartData.filter((d) => d.pm25 > 120) : chartData;

  const exportCsv = () => {
    const headers = 'LeadHour,Timestamp,PredictedPM25_ugm3,LowerBound_ugm3,UpperBound_ugm3,ImpliedAQICategory\n';
    const rows = chartData
      .map(
        (d) =>
          `"${d.hour}","${d.displayTime}",${d.pm25.toFixed(2)},${d.lowerBound.toFixed(2)},${d.upperBound.toFixed(2)},"${d.aqiCategory}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStation?.name || 'station'}_forecast_${horizon}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
            <TrendingUp className="h-4 w-4" />
            <span>Multi-Horizon ML Forecast Studio</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            72-Hour PM2.5 Forecast: {selectedStation ? selectedStation.name : 'Station'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Weather-coupled direct multi-step XGBoost regression heads
          </p>
        </div>

        {/* Horizon Picker */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xs">
          <Clock className="h-4 w-4 text-slate-400 ml-2" />
          <span className="text-slate-500 font-semibold mr-1 text-[11px]">Horizon:</span>
          {([24, 48, 72] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                horizon === h
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              +{h}h
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Forecast Average</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{avgVal}</span>
            <span className="text-xs text-slate-400 font-medium">µg/m³</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Across next {horizon} hours</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Peak Concentration</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600">{maxVal.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-medium">µg/m³</span>
          </div>
          <span className="text-[10px] text-rose-500 font-medium mt-1 block">Expected at {peakItem?.hour || '--'}</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Lowest Concentration</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{minVal.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-medium">µg/m³</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">During daytime ventilation</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Exceedance Rate</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{exceedPct}%</span>
            <span className="text-xs text-slate-400 font-medium">of hours</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Above safe 60 µg/m³ limit</span>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Predicted Hourly PM2.5 Trajectory with 90% Confidence Band
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct multi-step XGBoost regression heads with ERA5 surface covariates
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-blue-600"></span>
              <span className="text-slate-700">ML Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded bg-blue-100 border border-blue-200"></span>
              <span className="text-slate-500">90% CI Bounds</span>
            </div>
          </div>
        </div>

        {/* Chart Frame */}
        <div className="h-84 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="lightForecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  dy={8}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 'auto']}
                  unit=""
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg font-sans">
                        <div className="border-b border-slate-100 pb-1 mb-2 font-bold text-slate-900 flex justify-between gap-4">
                          <span>{d.displayTime}</span>
                          <span className="text-blue-600 font-mono">Lead: {d.hour}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Predicted PM2.5:</span>
                            <span className="font-bold text-blue-600 text-sm">{d.pm25.toFixed(1)} µg/m³</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[11px]">
                            <span className="text-slate-400">Uncertainty (90% CI):</span>
                            <span className="text-slate-600">[{d.lowerBound.toFixed(1)} – {d.upperBound.toFixed(1)}]</span>
                          </div>
                          <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Implied AQI:</span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[10px] border ${d.aqiBg}`}
                            >
                              {d.aqiCategory}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Reference Lines */}
                <ReferenceLine y={60} stroke="#10b981" strokeDasharray="4 4" label={{ value: '60 Safe Limit', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={120} stroke="#f97316" strokeDasharray="4 4" label={{ value: '120 Poor', fill: '#f97316', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '250 Very Poor', fill: '#ef4444', fontSize: 10, position: 'right' }} />

                {/* Bounds Area */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="transparent"
                  fill="#93c5fd"
                  fillOpacity={0.35}
                />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#lightForecastAreaGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="#60a5fa"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No forecast records available. Click Sync to fetch.
            </div>
          )}
        </div>
      </div>

      {/* Hourly Ledger Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Hourly Prediction Ledger</h2>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                onClick={() => setTableFilter('all')}
                className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  tableFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Hours ({chartData.length})
              </button>
              <button
                onClick={() => setTableFilter('high')}
                className={`rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  tableFilter === 'high' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Poor & Above (&gt;120)
              </button>
            </div>

            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Lead Hour</th>
                <th className="py-2.5 px-3">Forecast Timestamp</th>
                <th className="py-2.5 px-3 text-right">Predicted PM2.5</th>
                <th className="py-2.5 px-3 text-right">90% CI Bounds</th>
                <th className="py-2.5 px-3 text-center">Implied AQI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {tableData.map((d) => (
                <tr key={d.leadHours} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3 font-bold text-blue-600">{d.hour}</td>
                  <td className="py-2 px-3 text-slate-600">{d.displayTime}</td>
                  <td className="py-2 px-3 text-right font-black text-slate-900 text-sm">
                    {d.pm25.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500 text-xs font-mono">
                    [{d.lowerBound.toFixed(1)} – {d.upperBound.toFixed(1)}]
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${d.aqiBg}`}
                    >
                      {d.aqiCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
