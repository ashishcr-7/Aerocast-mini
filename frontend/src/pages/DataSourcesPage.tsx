import React from 'react';
import { Database, CloudRain, CheckCircle2 } from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
          <Database className="h-4 w-4" />
          <span>Public Data Sources & Atmospheric Pipelines</span>
        </div>
        <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Data Provenance & Ingestion Architecture
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Authoritative real-time public observations and reanalysis weather models powering AeroCast
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source 1: OpenAQ / CPCB */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">OpenAQ v3 API (CPCB CAAQMS)</h2>
                <span className="text-[11px] text-slate-400">Continuous Air Quality Monitoring</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Ingests real-time and historical continuous ambient air quality measurements from the Central Pollution Control Board (CPCB) monitoring stations across Delhi, Gurugram, and Noida.
          </p>

          <div className="space-y-1.5 text-xs font-medium text-slate-700 border-t border-slate-50 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pollutants: PM2.5, PM10, NO2, SO2, CO, O3</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Frequency: Hourly calibrated observations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Format: RESTful JSON v3 API</span>
            </div>
          </div>
        </div>

        {/* Source 2: Open-Meteo */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CloudRain className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Open-Meteo (ERA5 & GFS)</h2>
                <span className="text-[11px] text-slate-400">ECMWF Reanalysis & NOAA Forecasting</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Provides planetary boundary layer height (PBLH), wind speed and vectors at 10m, ambient 2m temperature, relative humidity, and surface pressure.
          </p>

          <div className="space-y-1.5 text-xs font-medium text-slate-700 border-t border-slate-50 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Covariates: Boundary layer height, wind U/V, RH, Temp</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Historical: ECMWF ERA5 (1940 to present)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Forecast: NOAA GFS 72-hour operational run</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
