export interface DailyWeather {
  year: number;
  doy: number;
  tempRange: number;
  precip: number;
}

export interface Climatology {
  doy: number;
  avgTemp: number;
  avgPrecip: number;
  count: number;
}

export interface ForecastDay {
  date: string; // "Mon, Jan 1"
  predictedTemp: number;
  predictedPrecip: number;
  historicalAvgTemp: number;
}

export interface AIInsight {
  summary: string;
  realTimeComparison: string;
  advice: string;
  sources: Array<{ title: string; uri: string }>;
  currentTemp?: number;
  condition?: string;
}

export interface User {
  email: string;
  name: string;
}

export enum AppState {
  AUTH = 'AUTH',
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
}