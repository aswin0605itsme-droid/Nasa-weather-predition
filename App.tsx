import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { parseNASAData, calculateClimatology, adjustDataForLocation } from './utils';
import { AppState, Climatology, User } from './types';
import { NASA_CSV_DATA } from './data/weatherData';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [climatology, setClimatology] = useState<Map<number, Climatology>>(new Map());
  const [location, setLocation] = useState({ lat: 13.1186, lon: 80.1083 });
  const [user, setUser] = useState<User | null>(null);
  
  // Loading & Error state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing Systems...");
  const [error, setError] = useState<string | null>(null);

  const BASE_LAT = 13.1186;

  useEffect(() => {
    // 1. Check for User Session
    const storedUser = localStorage.getItem('weather_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Load Data with visual progress (Initial Load)
    processDataSequence(location.lat, location.lon, true);
  }, []);

  const processDataSequence = async (targetLat: number, targetLon: number, isInitial: boolean = false) => {
    // Reset Error State
    setError(null);

    // If not initial, reset app state to loading to show transition
    if (!isInitial) {
        setAppState(AppState.LOADING);
        setLoadingProgress(0);
    }

    // Step 1: Parse/Ingest
    const isNewLocation = targetLat !== BASE_LAT;
    setLoadingText(isNewLocation ? `Acquiring Sector Data (${targetLat.toFixed(2)}, ${targetLon.toFixed(2)})...` : "Parsing NASA MERRA-2 Dataset...");
    setLoadingProgress(10);
    
    // Simulate network/processing delay
    await new Promise(r => setTimeout(r, 600));

    try {
      if (!NASA_CSV_DATA) {
        throw new Error("Internal Data Corruption: Source missing.");
      }

      const csvText = NASA_CSV_DATA;
      let parsedData = parseNASAData(csvText);
      
      if (!parsedData || parsedData.length === 0) {
         throw new Error("Data Parsing Error: No valid meteorological records found.");
      }
      
      // Step 2: Simulation/Adjustment
      if (isNewLocation) {
          setLoadingText("Triangulating Historical Models...");
          setLoadingProgress(40);
          await new Promise(r => setTimeout(r, 500));
          
          try {
            // Modify data based on new location to simulate "local" history
            parsedData = adjustDataForLocation(parsedData, BASE_LAT, targetLat);
          } catch (simError) {
             console.error("Simulation error", simError);
             throw new Error("Simulation Engine Failure: Could not adjust for target coordinates.");
          }
      } else {
          setLoadingProgress(40);
      }
      
      // Step 3: Training
      setLoadingText("Training Linear Regression Models...");
      setLoadingProgress(70);
      await new Promise(r => setTimeout(r, 400)); // Allow UI to paint

      // Step 4: Optimization
      setLoadingText("Optimizing for Seasonal Seasonality...");
      setLoadingProgress(90);
      
      // Heavy calculation wrapped in timeout to allow UI update
      setTimeout(() => {
          try {
            const clim = calculateClimatology(parsedData);
            if (clim.size === 0) {
                throw new Error("Model Training Error: Insufficient data points for regression.");
            }
            setClimatology(clim);
            setLoadingProgress(100);
            setLoadingText("System Ready.");
            
            // Small delay before showing dashboard
            setTimeout(() => {
               setAppState(AppState.AUTH); 
            }, 400);
          } catch (calcError) {
             console.error("Calculation error", calcError);
             handleError(calcError);
          }
      }, 100);

    } catch (e) {
      handleError(e);
    }
  };

  const handleError = (e: any) => {
      console.error("Critical Process Failure", e);
      setLoadingText("Critical Failure.");
      setError(e instanceof Error ? e.message : "An unexpected anomaly occurred during data initialization.");
  };

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('weather_user');
    setUser(null);
  };

  const handleLocationChange = (lat: number, lon: number) => {
    setLocation({ lat, lon });
    // Trigger re-calculation sequence for the new location
    processDataSequence(lat, lon, false);
  };

  const renderContent = () => {
    // 1. Error View
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6 animate-fade-in">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <i className="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 text-center">System Malfunction</h2>
          <div className="bg-space-800 border border-red-900/50 p-4 rounded-lg mb-8 w-full">
             <p className="text-red-300 text-sm text-center font-mono leading-relaxed">
                {error}
             </p>
          </div>
          
          <button 
            onClick={() => processDataSequence(location.lat, location.lon, false)}
            className="group relative px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <span className="flex items-center gap-2">
               <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i>
               <span>Re-initialize Sequence</span>
            </span>
          </button>
        </div>
      );
    }

    // 2. Loading View
    if (appState === AppState.LOADING) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-space-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-space-accent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-space-accent">
                {loadingProgress}%
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 text-center">System Processing</h2>
          <p className="text-gray-400 text-sm mb-6 text-center font-mono h-6">{loadingText}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-space-800 rounded-full h-2 border border-space-700 overflow-hidden">
            <div 
                className="bg-space-accent h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          <div className="mt-4 flex justify-between w-full text-[10px] text-gray-600 font-mono uppercase">
            <span>Ingestion</span>
            <span>Training</span>
            <span>Inference</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
    }

    return (
      <Dashboard 
        climatology={climatology} 
        location={location}
        onLocationChange={handleLocationChange}
        onLogout={handleLogout}
        user={user}
      />
    );
  };

  return (
    <div className="min-h-screen bg-space-900 text-gray-100 flex flex-col">
      <nav className="border-b border-space-700 bg-space-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-meteor text-space-accent text-2xl mr-3"></i>
              <span className="font-bold text-xl tracking-tight">NASA Weather<span className="text-space-accent">AI</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500 hidden sm:inline">Powered by Gemini & MERRA-2</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <footer className="border-t border-space-700 py-6 mt-auto">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NASA Weather Predictor. Data provided by NASA/POWER.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;