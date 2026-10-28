export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  openaqId?: string;
  source: string;
  isActive?: boolean;
}

export interface AQIResult {
  aqi: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  color: string;
  concentration: number;
}

export interface WeatherRecord {
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  pressure: number;
  boundaryLayerHeight: number;
  source: string;
}

export interface ForecastItem {
  id: string;
  stationId: string;
  issuedAt: string;
  forecastTime: string;
  leadHours: number;
  pollutant: string;
  predictedValue: number;
  lowerBound?: number;
  upperBound?: number;
  unit: string;
  modelVersion: string;
  dataQuality: string;
}

export interface TrappingRisk {
  level: 'low' | 'moderate' | 'high' | 'extreme';
  score: number;
  maxScore: number;
  factors: string[];
  dataQuality: string;
}

export interface TrappingAnalysisResponse {
  stationId: string;
  timestamp: string;
  disclaimer: string;
  trappingRisk: TrappingRisk;
  weather: WeatherRecord | null;
  currentAqi: AQIResult | null;
  latestPm25: {
    value: number;
    unit: string;
    timestamp: string;
  } | null;
}

export interface ModelMetric {
  id: string;
  modelName: string;
  pollutant: string;
  leadHours: number;
  mae: number;
  rmse: number;
  r2: number;
  trainingPeriod: string;
  testPeriod: string;
}

export interface PollutionObs {
  id: string;
  stationId: string;
  timestamp: string;
  pollutant: string;
  value: number;
  unit: string;
}
