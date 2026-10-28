import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type {
  Station,
  ForecastItem,
  TrappingAnalysisResponse,
  WeatherRecord,
  PollutionObs,
  ModelMetric,
} from '../types';

interface StationContextType {
  stations: Station[];
  selectedStationId: string;
  selectedStation: Station | null;
  setSelectedStationId: (id: string) => void;
  forecasts: ForecastItem[];
  analysis: TrappingAnalysisResponse | null;
  weatherHistory: WeatherRecord[];
  pollutionHistory: PollutionObs[];
  modelMetrics: ModelMetric[];
  stationPm25Map: Record<string, number>;
  loading: boolean;
  isRefreshing: boolean;
  aiConnected: boolean;
  lastUpdated: string | null;
  error: string | null;
  horizon: 24 | 48 | 72;
  setHorizon: (h: 24 | 48 | 72) => void;
  refresh: () => void;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [analysis, setAnalysis] = useState<TrappingAnalysisResponse | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<WeatherRecord[]>([]);
  const [pollutionHistory, setPollutionHistory] = useState<PollutionObs[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([]);
  const [stationPm25Map, setStationPm25Map] = useState<Record<string, number>>({});
  const [horizon, setHorizon] = useState<24 | 48 | 72>(72);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [aiConnected, setAiConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Fetch stations, system health, and model metrics
  useEffect(() => {
    async function initSystem() {
      setLoading(true);
      try {
        const [stRes, hRes, mRes] = await Promise.all([
          api.stations(),
          api.health(),
          api.modelMetrics(),
        ]);

        if (stRes.data?.stations && stRes.data.stations.length > 0) {
          const list: Station[] = stRes.data.stations;
          setStations(list);
          setSelectedStationId(list[0].id);
        }

        if (hRes.data?.aiService?.status === 'ok' || hRes.data?.aiService?.status === 'up') {
          setAiConnected(true);
        }

        if (mRes.data?.metrics) {
          setModelMetrics(mRes.data.metrics);
        }
      } catch (err: any) {
        console.error('System initialization error:', err);
        setError('Failed to initialize connection to air quality services.');
      } finally {
        setLoading(false);
      }
    }

    initSystem();
  }, []);

  // 2. Fetch Station-specific data (forecast, trapping analysis, weather, pollution)
  const fetchStationData = useCallback(async (stationId: string) => {
    if (!stationId) return;
    setIsRefreshing(true);
    setError(null);

    try {
      const [forecastRes, trappingRes, weatherRes, obsRes] = await Promise.all([
        api.forecast(stationId, 72),
        api.trapping(stationId),
        api.weather(stationId, 72),
        api.observations(stationId),
      ]);

      if (forecastRes.data?.forecasts) {
        setForecasts(forecastRes.data.forecasts);
      }

      if (trappingRes.data) {
        setAnalysis(trappingRes.data);
        if (trappingRes.data.latestPm25?.value) {
          setStationPm25Map((prev) => ({
            ...prev,
            [stationId]: trappingRes.data.latestPm25.value,
          }));
        }
      }

      if (weatherRes.data?.records) {
        setWeatherHistory(weatherRes.data.records);
      }

      if (obsRes.data?.observations) {
        setPollutionHistory(obsRes.data.observations);
      }

      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error('Error fetching station data:', err);
      setError('Unable to retrieve latest observations or forecast.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Trigger data fetch when station changes
  useEffect(() => {
    if (selectedStationId) {
      fetchStationData(selectedStationId);
    }
  }, [selectedStationId, fetchStationData]);

  const handleRefresh = useCallback(() => {
    if (selectedStationId) {
      fetchStationData(selectedStationId);
    }
  }, [selectedStationId, fetchStationData]);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || (stations[0] ?? null);

  return (
    <StationContext.Provider
      value={{
        stations,
        selectedStationId,
        selectedStation,
        setSelectedStationId,
        forecasts,
        analysis,
        weatherHistory,
        pollutionHistory,
        modelMetrics,
        stationPm25Map,
        loading,
        isRefreshing,
        aiConnected,
        lastUpdated,
        error,
        horizon,
        setHorizon,
        refresh: handleRefresh,
      }}
    >
      {children}
    </StationContext.Provider>
  );
};

export const useStation = (): StationContextType => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};
