import React, { useState, useEffect, useRef } from 'react';
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

  // Data persistence
  const rawDataRef = useRef<string>(NASA_CSV_DATA);

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

  const processDataSequence = async (targetLat: number, targetLon: number, isInitial: boolean = false, overrideData?: string) => {
    // Reset Error State
    setError(null);

    // If not initial, reset app state to loading to show transition
    if (!isInitial) {
        setAppState(AppState.LOADING);
        setLoadingProgress(0);
    }

    // Update raw data ref if override provided
    if (overrideData) {
      rawDataRef.current = overrideData;
    }

    // Step 1: Parse/Ingest
    const isNewLocation = targetLat !== BASE_LAT;
    setLoadingText(isNewLocation ? `Acquiring Sector Data (${targetLat.toFixed(2)}, ${targetLon.toFixed(2)})...` : "Parsing NASA MERRA-2 Dataset...");
    setLoadingProgress(10);
    
    // Simulate network/processing delay
    await new Promise(r => setTimeout(r, 600));

    try {
      const csvText = rawDataRef.current;
      if (!csvText) {
        throw new Error("Internal Data Corruption: Source missing.");
      }

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

  const handleFileUpload = (csvText: string) => {
    processDataSequence(location.lat, location.lon, false, csvText);
  };

  const renderContent = () => {
    // 1. Error View
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6 animate-fade-in">
          <div className="w-24 h-24 bg-space-rose/10 rounded-full flex items-center justify-center mb-6 border border-space-rose/30 shadow-glow">
            <i className="fas fa-exclamation-triangle text-space-rose text-4xl"></i>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">System Malfunction</h2>
          <div className="glass-panel p-6 rounded-xl mb-8 w-full border-l-4 border-space-rose">
             <p className="text-red-200 text-sm text-center font-mono leading-relaxed">
                {error}
             </p>
          </div>
          
          <button 
            onClick={() => processDataSequence(location.lat, location.lon, false)}
            className="group relative px-8 py-3 bg-space-rose/20 hover:bg-space-rose/30 text-space-rose border border-space-rose/50 rounded-lg transition-all hover:shadow-glow"
          >
            <span className="flex items-center gap-2">
               <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i>
               <span className="font-semibold tracking-wide">REBOOT SEQUENCE</span>
            </span>
          </button>
        </div>
      );
    }

    // 2. Loading View
    if (appState === AppState.LOADING) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6">
          <div className="relative w-32 h-32 mb-10">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-space-800 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-space-cyan rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-mono font-bold text-space-cyan tracking-widest">
                {loadingProgress}%
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">Processing Data</h2>
          <p className="text-space-cyan text-sm mb-8 text-center font-mono h-6 animate-pulse">{loadingText}</p>
          
          {/* Tech Progress Bar */}
          <div className="w-full bg-space-950 rounded-full h-1.5 border border-space-700 overflow-hidden shadow-inner">
            <div 
                className="bg-gradient-to-r from-space-accent to-space-cyan h-1.5 rounded-full transition-all duration-500 ease-out shadow-glow-cyan" 
                style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          <div className="mt-6 flex justify-between w-full text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            <span>Ingestion</span>
            <span>Training</span>
            <span>Validation</span>
            <span>Ready</span>
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
        onFileUpload={handleFileUpload}
      />
    );
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col font-sans selection:bg-space-cyan/30 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-space-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-space-accent to-space-cyan rounded-lg flex items-center justify-center shadow-lg shadow-space-accent/20">
                <i className="fas fa-meteor text-white text-lg"></i>
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-white block leading-none">NASA</span>
                <span className="text-xs text-space-cyan font-mono tracking-widest">WEATHER AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-space-800/50 border border-white/5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                SYSTEM ONLINE
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {renderContent()}
      </main>

      <footer className="border-t border-white/5 py-8 mt-auto bg-space-950/50 backdrop-blur-sm">
        <div className="container mx-auto text-center">
          <p className="text-gray-500 text-xs tracking-wider">
            &copy; {new Date().getFullYear()} NASA WEATHER PREDICTOR <span className="mx-2 text-space-700">|</span> POWERED BY GEMINI & MERRA-2
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;