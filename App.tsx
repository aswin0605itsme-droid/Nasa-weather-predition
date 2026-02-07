import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthScreen from './components/AuthScreen';
import { parseNASAData, calculateClimatology, adjustDataForLocation } from './utils';
import { AppState, Climatology, User } from './types';

// Lazy load the Dashboard to split the bundle (optimizes loading of Recharts/Leaflet)
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [climatology, setClimatology] = useState<Map<number, Climatology>>(new Map());
  const [location, setLocation] = useState({ lat: 13.1186, lon: 80.1083 });
  const [user, setUser] = useState<User | null>(null);
  
  // Loading & Error state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing Systems...");
  const [error, setError] = useState<string | null>(null);

  // Data persistence - initialized empty to prevent large bundle size
  const rawDataRef = useRef<string>("");

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
    setError(null);

    if (!isInitial) {
        setAppState(AppState.LOADING);
        setLoadingProgress(0);
    }

    // Step 0: Dynamic Data Ingestion (Performance Optimization)
    // We strictly load the massive dataset ONLY when needed, not in the main bundle.
    if (overrideData) {
      rawDataRef.current = overrideData;
    } else if (isInitial && !rawDataRef.current) {
       try {
         setLoadingText("Accessing NASA Archival Database...");
         setLoadingProgress(5);
         // Dynamic import to split code
         const dataModule = await import('./data/weatherData');
         rawDataRef.current = dataModule.NASA_CSV_DATA;
       } catch (err) {
         throw new Error("Database Connection Failed: Could not load historical records.");
       }
    }

    // Step 1: Parse/Ingest
    const isNewLocation = targetLat !== BASE_LAT;
    setLoadingText(isNewLocation ? `Acquiring Sector Data (${targetLat.toFixed(2)}, ${targetLon.toFixed(2)})...` : "Parsing NASA MERRA-2 Dataset...");
    setLoadingProgress(10);
    
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
      await new Promise(r => setTimeout(r, 400)); 

      // Step 4: Optimization
      setLoadingText("Optimizing for Seasonal Seasonality...");
      setLoadingProgress(90);
      
      setTimeout(() => {
          try {
            const clim = calculateClimatology(parsedData);
            if (clim.size === 0) {
                throw new Error("Model Training Error: Insufficient data points for regression.");
            }
            setClimatology(clim);
            setLoadingProgress(100);
            setLoadingText("System Ready.");
            
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
    processDataSequence(lat, lon, false);
  };

  const handleFileUpload = (csvText: string) => {
    processDataSequence(location.lat, location.lon, false, csvText);
  };

  const renderContent = () => {
    if (error) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <i className="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">System Malfunction</h2>
          <div className="glass-panel p-6 rounded-xl mb-8 w-full border-l-4 border-l-red-500">
             <p className="text-red-200 text-sm text-center font-mono leading-relaxed">
                {error}
             </p>
          </div>
          
          <button 
            onClick={() => processDataSequence(location.lat, location.lon, false)}
            className="group relative px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <span className="flex items-center gap-2">
               <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i>
               <span className="font-semibold tracking-wide">REBOOT SEQUENCE</span>
            </span>
          </button>
        </motion.div>
      );
    }

    if (appState === AppState.LOADING) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-[80vh] w-full max-w-md mx-auto px-6"
        >
          <div className="relative w-32 h-32 mb-10">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-900/30 rounded-full"></div>
            <div 
              className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 rounded-full animate-spin"
              style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-mono font-bold text-cyan-400 tracking-widest">
                {loadingProgress}%
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">Processing Data</h2>
          <p className="text-cyan-400/80 text-sm mb-8 text-center font-mono h-6 animate-pulse">{loadingText}</p>
          
          {/* Tech Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-700 overflow-hidden shadow-inner">
            <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
          
          <div className="mt-6 flex justify-between w-full text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            <span>Ingestion</span>
            <span>Training</span>
            <span>Validation</span>
            <span>Ready</span>
          </div>
        </motion.div>
      );
    }

    if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
    }

    // Glassmorphism Fallback UI for Suspense
    return (
      <Suspense fallback={
        <div className="flex h-[80vh] items-center justify-center w-full">
          <div className="relative flex flex-col items-center">
            {/* Spinning Rings */}
            <div className="w-24 h-24 rounded-full border-2 border-white/5 border-t-cyan-400 animate-spin"></div>
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-2 border-transparent border-b-indigo-500 animate-spin-slow opacity-60"></div>
            
            {/* Pulsing Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full blur-md animate-pulse"></div>
            
            <div className="mt-8 flex flex-col items-center">
                <span className="text-xs font-mono text-cyan-400 tracking-[0.3em] animate-pulse">
                    LOADING MODULES
                </span>
                <span className="text-[10px] text-slate-500 mt-2 font-mono">
                    Initializing Visualization Engine...
                </span>
            </div>
          </div>
        </div>
      }>
        <Dashboard 
          climatology={climatology} 
          location={location}
          onLocationChange={handleLocationChange}
          onLogout={handleLogout}
          user={user}
          onFileUpload={handleFileUpload}
        />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Navbar with Glassmorphism */}
      <nav className="glass-panel border-b-0 sticky top-0 z-50 rounded-b-2xl mx-4 mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <i className="fas fa-meteor text-white text-lg"></i>
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-white block leading-none">NASA</span>
                <span className="text-xs text-cyan-400 font-mono tracking-widest">WEATHER AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/10 text-xs text-gray-400 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                SYSTEM ONLINE
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 py-8 mt-auto bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto text-center">
          <p className="text-slate-500 text-xs tracking-wider">
            &copy; {new Date().getFullYear()} NASA WEATHER PREDICTOR <span className="mx-2 text-slate-700">|</span> POWERED BY GEMINI & MERRA-2
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;