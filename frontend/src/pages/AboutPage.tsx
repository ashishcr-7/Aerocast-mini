import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Database,
  ShieldAlert,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Academic Honesty & Research Methodology</span>
        </div>
        <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Scientific Principles & Architectural Disclaimer
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Transparent explanation of model capabilities, limitations, and operational differences from numerical chemistry simulations
        </p>
      </div>

      {/* Primary Alert Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed space-y-1.5 shadow-xs">
        <h2 className="font-bold text-amber-800 text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          Academic Prototype Notice
        </h2>
        <p>
          This application is a <strong>weather-aware statistical machine learning forecasting prototype</strong> designed for academic evaluation. It is <strong>not</strong> a fully coupled 3-dimensional Eulerian chemical transport simulation such as <strong>WRF-Chem</strong>, <strong>CHIMERE</strong>, or <strong>CMAQ</strong>.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Scientific Architecture Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Dimension</th>
                <th className="py-2.5 px-3 text-blue-600 font-bold">AeroCast (Our ML System)</th>
                <th className="py-2.5 px-3 text-slate-500 font-bold">3D Chemical Transport (WRF-Chem / CMAQ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans text-slate-700">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Atmospheric Physics</td>
                <td className="py-3 px-3 text-blue-900">
                  Ingests surface & boundary layer covariates (PBL height, wind vectors, RH, temperature, pressure) as tabular features.
                </td>
                <td className="py-3 px-3 text-slate-500">
                  Numerically solves 3D Navier-Stokes equations and atmospheric thermodynamics across regional grid cells.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Chemical Kinetics</td>
                <td className="py-3 px-3 text-blue-900">
                  <strong>Implicit:</strong> Learns statistical non-linear relationships between meteorological covariates and observed PM2.5.
                </td>
                <td className="py-3 px-3 text-slate-500">
                  <strong>Explicit:</strong> Numerically integrates photochemical gas-phase reactions and secondary organic/inorganic aerosol formation.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Emission Inventories</td>
                <td className="py-3 px-3 text-blue-900">
                  Station-level cyclical diurnals and lag encodings represent anthropogenic schedules.
                </td>
                <td className="py-3 px-3 text-slate-500">
                  Spatially gridded anthropogenic, agricultural, and biomass burning inventories (EDGAR, FINN).
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Compute Latency</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">
                  &lt; 50 milliseconds on standard CPU
                </td>
                <td className="py-3 px-3 text-slate-500">
                  Hours to days on High-Performance Computing (HPC) clusters
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Operational Role</td>
                <td className="py-3 px-3 text-blue-900">
                  High-speed real-time early warning, rapid scenario analysis, edge deployment.
                </td>
                <td className="py-3 px-3 text-slate-500">
                  Regulatory policy formulation, national emission standard assessments.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Provenance */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          Data Provenance & Ingestion Pipelines
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <h3 className="font-bold text-blue-700 text-xs">CPCB Air Quality Observations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hourly continuous ambient air quality monitoring station data (CAAQMS) ingested via the OpenAQ v3 public REST API for 10 calibrated stations across Delhi, Gurugram, and Noida.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <h3 className="font-bold text-blue-700 text-xs">ECMWF ERA5 & NOAA GFS Weather</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hourly boundary layer height, 10m wind speed/direction, 2m temperature, relative humidity, and surface pressure retrieved via Open-Meteo API.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Citations */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-500 space-y-2 shadow-xs">
        <h2 className="font-bold text-slate-800 text-xs mb-1">Key Academic References:</h2>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>
            Chen, T., & Guestrin, C. (2016). <em>XGBoost: A Scalable Tree Boosting System</em>. Proceedings of the 22nd ACM SIGKDD International Conference.
          </li>
          <li>
            Guttikunda, S. K., & Gurjar, B. R. (2012). <em>Role of meteorology in phenology of air pollution over Delhi, India</em>. Atmospheric Environment, 59, 264-277.
          </li>
          <li>
            CPCB (2014). <em>National Air Quality Index: Development of Indian AQI Breakpoints</em>. Ministry of Environment, Forest and Climate Change, Govt. of India.
          </li>
        </ul>
      </div>
    </div>
  );
};
