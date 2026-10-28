import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStation } from '../context/StationContext';
import { StationMap } from '../components/StationMap';
import {
  MapPin,
  Search,
  ArrowRight,
  Compass,
} from 'lucide-react';

export const StationsPage: React.FC = () => {
  const { stations, selectedStationId, setSelectedStationId, stationPm25Map } = useStation();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const getAQIInfo = (val?: number) => {
    if (val == null || val <= 0) return { cat: 'No Data', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (val <= 60) return { cat: 'Good', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (val <= 120) return { cat: 'Moderate', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    if (val <= 250) return { cat: 'Poor', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { cat: 'Very Poor', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAndForecast = (stationId: string) => {
    setSelectedStationId(stationId);
    navigate('/forecast');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
            <MapPin className="h-4 w-4" />
            <span>Spatial Air Quality Monitoring Network</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Delhi NCR Station Network ({stations.length} Active Stations)
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Continuous real-time PM2.5 monitoring stations across Delhi, Gurugram, and Noida
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Spatial Map Component - Large & spacious */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
        <div className="h-[480px] w-full">
          <StationMap
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            stationPm25Map={stationPm25Map}
          />
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Station Directory</span>
            <span className="text-xs text-slate-400 font-normal">
              (Click any station to switch active forecast)
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStations.map((st) => {
            const isSelected = st.id === selectedStationId;
            const pm25 = stationPm25Map[st.id] ?? 0;
            const aqi = getAQIInfo(pm25);

            return (
              <div
                key={st.id}
                className={`rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between bg-white ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/10'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {st.name}
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">{st.city} &bull; OpenAQ #{st.openaqId || 'N/A'}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${aqi.bg}`}>
                      {aqi.cat}
                    </span>
                  </div>

                  {/* PM2.5 Stat */}
                  <div className="my-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {pm25 > 0 ? pm25.toFixed(1) : '--'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">µg/m³</span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {pm25 > 60 ? `${(pm25 / 60).toFixed(1)}x Standard` : 'Within safe limit'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Compass className="h-3 w-3 text-slate-400" />
                    <span>{st.latitude.toFixed(4)}°N, {st.longitude.toFixed(4)}°E</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => setSelectedStationId(st.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Active Station' : 'Select'}
                  </button>

                  <button
                    onClick={() => handleSelectAndForecast(st.id)}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    title="View 72-hour forecast for this station"
                  >
                    <span>Forecast</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
