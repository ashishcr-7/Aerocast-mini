import React from 'react';
import { X, AlertTriangle, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface ScientificDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificDisclaimerModal: React.FC<ScientificDisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Scientific Disclaimer & Academic Methodology
              </h3>
              <p className="text-xs text-amber-200/80">
                Weather-Aware Machine Learning vs. 3D Chemical Transport Simulations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 max-h-[75vh] overflow-y-auto leading-relaxed">
          {/* Core Distinction */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              1. Fundamental Modeling Distinction
            </h4>
            <p className="mb-2">
              This system is an <strong>academic research prototype</strong> demonstrating <em>weather-coupled statistical machine learning forecasting</em> for PM2.5 particulate matter in Delhi NCR.
            </p>
            <p>
              It is <strong>NOT</strong> a fully coupled Eulerian 3-dimensional atmospheric chemistry simulation such as <strong>WRF-Chem</strong> (Weather Research and Forecasting coupled with Chemistry), <strong>CHIMERE</strong>, or <strong>CMAQ</strong> (Community Multiscale Air Quality Modeling System).
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Dimension</th>
                  <th className="py-2.5 px-3 font-medium text-cyan-400">Our Weather-Aware ML System</th>
                  <th className="py-2.5 px-3 font-medium text-amber-400">3D Chemical Transport (WRF-Chem)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="py-2 px-3 font-medium text-white">Atmospheric Physics</td>
                  <td className="py-2 px-3 text-slate-300">Surface & PBL covariates (BLH, wind vectors, RH, temp, pressure) ingested as ML tabular features.</td>
                  <td className="py-2 px-3 text-slate-300">Numerical solution of Navier-Stokes fluid dynamics and atmospheric thermodynamic equations on 3D grid cells.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-white">Chemical Transformations</td>
                  <td className="py-2 px-3 text-slate-300">Implicit: statistical correlation with precursor pollutants (NO2, SO2, CO) and weather conditions.</td>
                  <td className="py-2 px-3 text-slate-300">Explicit: photolysis rates, gas-phase chemical mechanisms (e.g. MOZART, RADM2), and secondary aerosol thermodynamics (ISORROPIA).</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-white">Emission Inventories</td>
                  <td className="py-2 px-3 text-slate-300">Station diurnal & seasonal cycles captured through cyclical lag features and temporal encodings.</td>
                  <td className="py-2 px-3 text-slate-300">High-resolution spatial anthropogenic, biogenic, and biomass burning emission inventories (EDGAR, FINN).</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-white">Inference Latency</td>
                  <td className="py-2 px-3 text-emerald-400 font-semibold">&lt; 50 milliseconds on lightweight CPU.</td>
                  <td className="py-2 px-3 text-rose-400 font-semibold">Hours to days across high-performance supercomputing clusters (HPC).</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Trapping Mechanism Explanation */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              2. Atmospheric Trapping Indicator Caveat
            </h4>
            <p className="mb-2">
              The <strong>Trapping Risk Indicator</strong> implemented in AeroCast is an empirical, rule-based diagnostic indicator derived from known meteorological compounding factors:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Surface wind speeds &lt; 5 km/h (prevention of horizontal advective dispersion)</li>
              <li>Planetary boundary layer height (BLH) &lt; 300 meters (nocturnal vertical compression)</li>
              <li>Relative humidity &gt; 75% (hygroscopic aerosol condensation and secondary haze acceleration)</li>
            </ul>
            <p className="mt-2 text-slate-400">
              This provides a real-time actionable risk surrogate for academic evaluation and early warning, but does not substitute for radio-sonde soundings or LIDAR vertical profile validation.
            </p>
          </div>

          {/* Data Provenance & Reproducibility */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3. Data Provenance & Reproducibility
            </h4>
            <p>
              Observations are fetched from publicly accessible open monitoring channels: Central Pollution Control Board (CPCB) continuous ambient air quality stations via OpenAQ v3, and hourly historical/forecast weather from Open-Meteo ERA5 Reanalysis and GFS. All pipelines strictly enforce zero-leakage chronological splits (70% train / 15% validation / 15% test).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
