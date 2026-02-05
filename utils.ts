import { DailyWeather, Climatology } from './types';

export const doyToDate = (doy: number, year: number = new Date().getFullYear()): Date => {
  const date = new Date(year, 0); // Jan 1st
  return new Date(date.setDate(doy)); // Add days
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const parseNASAData = (csvText: string): DailyWeather[] => {
  const lines = csvText.split('\n');
  const data: DailyWeather[] = [];
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (trimmed === '-END HEADER-') {
      headerFound = true;
      continue;
    }

    if (!headerFound) continue;

    if (trimmed.startsWith('YEAR,DOY') || trimmed.startsWith('YEAR\tDOY')) continue;

    const parts = trimmed.split(/[,\t]/);
    
    if (parts.length >= 4) {
      const year = +parts[0];
      const doy = +parts[1];
      const tempRange = +parts[2];
      const precip = +parts[3];

      if (!isNaN(year) && !isNaN(doy) && !isNaN(tempRange) && !isNaN(precip)) {
        data.push({ year, doy, tempRange, precip });
      }
    }
  }
  return data;
};

// --- DATA SCIENCE ENGINE ---

export const adjustDataForLocation = (data: DailyWeather[], baseLat: number, newLat: number): DailyWeather[] => {
  const latDiff = Math.abs(newLat) - Math.abs(baseLat);
  // Heuristic: Temp drops ~0.75°C per degree latitude away from equator
  const tempChange = -(latDiff * 0.75); 
  
  return data.map(d => {
    // Add varying noise based on seasonality to simulate local variance
    const noise = (Math.sin(d.doy * 0.1) * 0.5) + ((Math.random() - 0.5) * 1.5);
    
    let newTemp = d.tempRange + tempChange + noise;
    
    // Physical constraints
    if (newLat > 60 || newLat < -60) newTemp -= 5; 

    return {
      ...d,
      tempRange: newTemp,
      precip: Math.max(0, d.precip * (0.8 + Math.random() * 0.4))
    };
  });
};

/**
 * STEP 2: MINMAX SCALING
 * Normalizes data to [0, 1] range to prevent weight collapse and scaling bias.
 */
class MinMaxScaler {
  private min: number = 0;
  private max: number = 1;

  fit(data: number[]) {
    this.min = Math.min(...data);
    this.max = Math.max(...data);
    if (this.max === this.min) this.max = this.min + 1; // Avoid divide by zero
  }

  transform(data: number[]): number[] {
    return data.map(x => (x - this.min) / (this.max - this.min));
  }

  inverseTransform(val: number): number {
    return val * (this.max - this.min) + this.min;
  }
}

// --- LINEAR ALGEBRA UTILS (For OLS Regression) ---

function multiply(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = A[0].length, p = B[0].length;
  const C = Array(m).fill(0).map(() => Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < n; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

function transpose(A: number[][]): number[][] {
  return A[0].map((_, i) => A.map(row => row[i]));
}

// Generic Gaussian Elimination for Matrix Inversion (Supports N x N)
function inverse(M: number[][]): number[][] {
    const n = M.length;
    // Create augmented matrix [M | I]
    const A = M.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

    for (let i = 0; i < n; i++) {
        // Pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];

        const pivot = A[i][i];
        if (Math.abs(pivot) < 1e-10) continue; // Singularity check

        for (let j = i; j < 2 * n; j++) A[i][j] /= pivot;

        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = A[k][i];
                for (let j = i; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
            }
        }
    }
    // Extract right half
    return A.map(row => row.slice(n));
}

/**
 * Calculates climatology using an Autoregressive OLS Model (AR-7).
 * Pipeline:
 * 1. Preprocessing (Bias correction, sorting)
 * 2. MinMax Scaling
 * 3. Feature Engineering (Cyclical Date + 7-Day Sliding Window)
 * 4. Training (Normal Equation)
 * 5. Generative Forecasting (Recursive prediction)
 */
export const calculateClimatology = (data: DailyWeather[]): Map<number, Climatology> => {
  const climMap = new Map<number, Climatology>();
  
  // Sort chronologically
  data.sort((a, b) => (a.year * 1000 + a.doy) - (b.year * 1000 + b.doy));

  // Extract raw targets
  let rawTemps = data.map(d => d.tempRange);
  
  // Basic sanity check/bias correction for NASA "Range" vs "Mean" parameter confusion
  const avgRaw = rawTemps.reduce((a,b) => a+b, 0) / rawTemps.length;
  const BIAS_OFFSET = (avgRaw < 15 && avgRaw > -5) ? 20.0 : 0; 
  rawTemps = rawTemps.map(v => v + BIAS_OFFSET);

  // --- STEP 2: MINMAX SCALING ---
  const scaler = new MinMaxScaler();
  scaler.fit(rawTemps);
  const scaledTemps = scaler.transform(rawTemps);

  // --- STEP 3: SLIDING WINDOW DATASET CREATION ---
  const WINDOW_SIZE = 7;
  const X: number[][] = [];
  const y: number[][] = [];

  for (let i = WINDOW_SIZE; i < data.length; i++) {
    const doy = data[i].doy;
    
    // Cyclical Encoding
    const theta = (2 * Math.PI * doy) / 365.25;
    const sin_doy = Math.sin(theta);
    const cos_doy = Math.cos(theta);

    // Sliding Window (Past 7 days)
    const lags = [];
    for (let k = 1; k <= WINDOW_SIZE; k++) {
      lags.push(scaledTemps[i - k]);
    }

    // Feature Vector: [Bias, Sin, Cos, Lag1, Lag2, ... Lag7]
    X.push([1, sin_doy, cos_doy, ...lags]);
    y.push([scaledTemps[i]]);
  }

  // --- STEP 4: TRAIN MODEL (OLS) ---
  // Normal Equation: Beta = (X^T * X)^-1 * X^T * Y
  let weights: number[];
  try {
    const Xt = transpose(X);
    const XtX = multiply(Xt, X);
    const XtX_inv = inverse(XtX);
    const XtY = multiply(Xt, y);
    const Beta_mat = multiply(XtX_inv, XtY);
    weights = Beta_mat.map(row => row[0]); // Flatten
  } catch (e) {
    console.error("Matrix Singularity in OLS, falling back to mean.", e);
    // Fallback weights: Intercept = 0.5 (mean), others 0
    weights = Array(10).fill(0);
    weights[0] = 0.5; 
  }

  // --- GENERATE CLIMATOLOGY (Generative Forecasting) ---
  // To build a smooth annual curve, we run the model generatively for 366 days.
  // We initialize the "lags" buffer with the average temperatures of the last 7 days of the dataset.
  
  // Calculate precip averages separately (stochastic nature makes AR hard for precip)
  const precipMap = new Map<number, number[]>();
  data.forEach(d => {
    if (!precipMap.has(d.doy)) precipMap.set(d.doy, []);
    precipMap.get(d.doy)?.push(d.precip);
  });

  // Seed buffer with the last known scaled data
  let currentLags = scaledTemps.slice(-WINDOW_SIZE).reverse(); 
  // currentLags[0] is t-1, currentLags[1] is t-2...

  for (let doy = 1; doy <= 366; doy++) {
    // 1. Construct Features for Forecast
    const theta = (2 * Math.PI * doy) / 365.25;
    const sin_doy = Math.sin(theta);
    const cos_doy = Math.cos(theta);
    
    // X vector: [1, sin, cos, lag1...lag7]
    const features = [1, sin_doy, cos_doy, ...currentLags];
    
    // 2. Predict (Dot Product)
    let scaledPrediction = 0;
    for(let w=0; w<weights.length; w++) {
        scaledPrediction += weights[w] * features[w];
    }

    // 3. Update Lags Buffer (Shift right, insert new prediction at front)
    currentLags.pop();
    currentLags.unshift(scaledPrediction);

    // --- STEP 4: INVERSE TRANSFORMATION ---
    // Convert scaled model output back to Degree Celsius
    const predictedTemp = scaler.inverseTransform(scaledPrediction);

    // Get average precip for this DOY
    const pVals = precipMap.get(doy) || [0];
    const avgPrecip = pVals.reduce((a,b) => a+b, 0) / (pVals.length || 1);

    climMap.set(doy, {
      doy,
      avgTemp: parseFloat(predictedTemp.toFixed(2)),
      avgPrecip: parseFloat(avgPrecip.toFixed(2)),
      count: pVals.length
    });
  }

  return climMap;
};

export const getForecast = (climatology: Map<number, Climatology>, startDoy: number, days: number = 7): Climatology[] => {
  const forecast: Climatology[] = [];
  let currentDoy = startDoy;
  
  for (let i = 0; i < days; i++) {
    if (currentDoy > 366) currentDoy = 1;
    const clim = climatology.get(currentDoy);
    if (clim) forecast.push(clim);
    currentDoy++;
  }
  return forecast;
};

export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};
