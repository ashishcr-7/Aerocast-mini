import React, { useEffect, useRef } from 'react';
import type { Station } from '../types';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface StationMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  stationPm25Map?: Record<string, number>;
  compact?: boolean;
}

// Re-center map when selected station changes
const MapRecenter: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
};

/** Convert a PM2.5 value to an RGBA colour string for the heatmap blobs */
function pm25ToRgba(val: number, alpha: number): string {
  if (val <= 30)  return `rgba(16,185,129,${alpha})`;   // green  – Good
  if (val <= 60)  return `rgba(132,204,22,${alpha})`;   // lime   – Satisfactory
  if (val <= 90)  return `rgba(245,158,11,${alpha})`;   // amber  – Moderate
  if (val <= 120) return `rgba(249,115,22,${alpha})`;   // orange – Poor
  if (val <= 250) return `rgba(239,68,68,${alpha})`;    // red    – Very Poor
  return           `rgba(124,58,237,${alpha})`;          // purple – Severe
}

/**
 * AQIHeatmapLayer
 * Draws a custom Canvas layer on the Leaflet map.  For each station it
 * renders a large radial-gradient circle whose colour encodes PM2.5.
 * No external plugin required — works perfectly in Vite/ESM.
 */
const AQIHeatmapLayer: React.FC<{
  stations: Station[];
  stationPm25Map: Record<string, number>;
}> = ({ stations, stationPm25Map }) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!stations.length) return;

    // ---- Custom Leaflet canvas layer (coordinate-system–correct) ----
    const CanvasLayer = L.Layer.extend({
      _canvas: null as HTMLCanvasElement | null,

      onAdd(m: L.Map) {
        const canvas = L.DomUtil.create('canvas', '') as HTMLCanvasElement;
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        // @ts-ignore
        this._canvas = canvas;
        m.getPanes().overlayPane!.appendChild(canvas);
        // Redraw on every pan frame, zoom, and resize
        m.on('viewreset zoom move', this._draw, this);
        // @ts-ignore
        this._map = m;
        this._draw();
        return this;
      },

      onRemove(m: L.Map) {
        m.off('viewreset zoom move', this._draw, this);
        // @ts-ignore
        if (this._canvas) L.DomUtil.remove(this._canvas);
      },

      _draw() {
        // @ts-ignore
        const canvas = this._canvas as HTMLCanvasElement;
        // @ts-ignore
        const m = this._map as L.Map;
        if (!canvas || !m) return;

        // ── KEY FIX ──────────────────────────────────────────────────────
        // overlayPane is CSS-transformed by Leaflet during panning.
        // We must work in *layer* coordinates (latLngToLayerPoint) and
        // then anchor the canvas with setPosition so it moves with the pane.
        const bounds  = m.getBounds();
        const topLeft = m.latLngToLayerPoint(bounds.getNorthWest());

        // Pin canvas top-left to the layer-coordinate origin
        L.DomUtil.setPosition(canvas, topLeft);

        // Size canvas to the visible viewport
        const size = m.getSize();
        canvas.width  = size.x;
        canvas.height = size.y;

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        stations.forEach((st) => {
          const pm25 = stationPm25Map[st.id] ?? 0;
          if (pm25 <= 0) return;

          // latLngToLayerPoint gives coordinates in the same system as topLeft
          const pt = m.latLngToLayerPoint([st.latitude, st.longitude]);
          const x  = pt.x - topLeft.x;
          const y  = pt.y - topLeft.y;

          const zoom = m.getZoom();
          const r = Math.max(35, 14 * (zoom - 7));

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
          gradient.addColorStop(0,    pm25ToRgba(pm25, 0.75));
          gradient.addColorStop(0.4,  pm25ToRgba(pm25, 0.48));
          gradient.addColorStop(0.75, pm25ToRgba(pm25, 0.20));
          gradient.addColorStop(1,    pm25ToRgba(pm25, 0));

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      },
    });

    // @ts-ignore
    const layer = new CanvasLayer();
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      layer.remove();
    };
  }, [stations, stationPm25Map, map]);

  return null;
};

/** Map-colour helpers used for circle markers and popups */
function getAQIColor(val?: number) {
  if (val == null || val <= 0) return '#10b981';
  if (val <= 60)  return '#10b981';
  if (val <= 120) return '#f59e0b';
  if (val <= 250) return '#f97316';
  return '#ef4444';
}

function getAQICategory(val?: number) {
  if (val == null || val <= 0) return 'Satisfactory';
  if (val <= 60)  return 'Good';
  if (val <= 120) return 'Moderate';
  if (val <= 250) return 'Poor';
  return 'Very Poor';
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  stationPm25Map = {},
  compact = false,
}) => {
  const [showHeatmap, setShowHeatmap] = React.useState(true);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const centerLat = selectedStation?.latitude  ?? 28.6139;
  const centerLon = selectedStation?.longitude ?? 77.209;

  return (
    <div className="relative w-full h-full flex flex-col justify-between">

      {/* Map wrapper */}
      <div className={`w-full rounded-xl overflow-hidden relative z-0 border border-slate-100 ${compact ? 'h-64' : 'h-80'}`}>

        {/* Toggle – sits above the map pane */}
        <div className="absolute top-3 right-3 z-[999] flex rounded-xl overflow-hidden shadow-md border border-slate-200 text-[11px] font-bold">
          <button
            onClick={() => setShowHeatmap(true)}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              showHeatmap ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🌡 Heatmap
          </button>
          <button
            onClick={() => setShowHeatmap(false)}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              !showHeatmap ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            📍 Stations
          </button>
        </div>

        <MapContainer
          center={[centerLat, centerLon]}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ background: '#f8fafc' }}
        >
          {/* Free OSM tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter lat={centerLat} lon={centerLon} />

          {/* Canvas-based AQI heatmap — drawn only when toggle is active */}
          {showHeatmap && stations.length > 0 && (
            <AQIHeatmapLayer stations={stations} stationPm25Map={stationPm25Map} />
          )}

          {/* Station dot markers — always visible, style adapts to mode */}
          {stations.map((st) => {
            const isSelected = st.id === selectedStationId;
            const pm25 = stationPm25Map[st.id] ?? 0;
            const color = getAQIColor(pm25);
            const cat   = getAQICategory(pm25);

            return (
              <CircleMarker
                key={st.id}
                center={[st.latitude, st.longitude]}
                radius={isSelected ? 11 : showHeatmap ? 5 : 9}
                pathOptions={{
                  fillColor:   color,
                  fillOpacity: showHeatmap ? 0.9 : 0.92,
                  color:       '#ffffff',
                  weight:      isSelected ? 2.5 : showHeatmap ? 1 : 2,
                }}
                eventHandlers={{ click: () => onSelectStation(st.id) }}
              >
                <Popup className="custom-map-popup" autoPan={false}>
                  <div className="p-1 text-slate-800 text-xs font-sans min-w-[140px]">
                    <strong className="text-sm block font-bold text-slate-900">{st.name}</strong>
                    <div className="mt-1 font-bold text-slate-800 text-xs">
                      {pm25 > 0 ? `${pm25.toFixed(1)} µg/m³` : 'No data'}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold" style={{ color }}>
                      {pm25 > 0 ? `AQI: ${Math.round(pm25 * 1.6)} (${cat})` : '—'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-3 pt-2 text-[11px] font-semibold text-slate-600">
        <span className="text-slate-400 font-normal italic">
          {showHeatmap ? 'AQI heatmap — click a dot for details' : 'Station markers — click to select'}
        </span>
        <div className="flex items-center gap-3">
          {[
            { label: 'Good',      bg: 'bg-emerald-500' },
            { label: 'Moderate',  bg: 'bg-amber-400'   },
            { label: 'Poor',      bg: 'bg-orange-500'  },
            { label: 'Very Poor', bg: 'bg-rose-500'    },
          ].map(({ label, bg }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${bg}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
