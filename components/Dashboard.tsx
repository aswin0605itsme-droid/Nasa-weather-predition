import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, 
  CloudRain, 
  Bot, 
  ArrowRight, 
  LogOut, 
  Upload, 
  Activity,
  Calendar,
  MessageSquare,
  Sun,
  LayoutDashboard,
  Globe,
  Building2
} from 'lucide-react';
import { Climatology, AIInsight, User } from '../types';
import { getForecast, getDayOfYear, doyToDate, formatDate } from '../utils';
import WeatherCharts from './WeatherCharts';
import { fetchWeatherInsights } from '../services/geminiService';
import LocationMap from './LocationMap';
import FileUploader from './FileUploader';
import WeatherCard from './WeatherCard';
import MissionPlanner from './MissionPlanner';

interface DashboardProps {
  climatology: Map<number, Climatology>;
  location: { lat: number; lon: number };
  onLocationChange: (lat: number, lon: number) => void;
  onLogout: () => void;
  user: User;
  onFileUpload: (data: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ climatology, location, onLocationChange, onLogout, user, onFileUpload }) => {
  const [todayData, setTodayData] = useState<Climatology | null>(null);
  const [forecast, setForecast] = useState<Climatology[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationName, setActiveLocationName] = useState('Sector 7G');
  const [showUploader, setShowUploader] = useState(false);
  
  // Feature 2: Urbanization Heat Island Correction State
  const [urbanFactor, setUrbanFactor] = useState(0.5); // Default 0.5 (Suburban)

  // Projection Days Selection (7, 14, 28)
  const [projectionDays, setProjectionDays] = useState<7 | 14 | 28>(7);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'overview' | 'map'>('overview');

  // 1. Calculate Forecast when projectionDays or data changes
  useEffect(() => {
    const todayDOY = getDayOfYear(new Date());
    const todayClim = climatology.get(todayDOY);
    const nextDays = getForecast(climatology, todayDOY, projectionDays);

    if (todayClim) {
      setTodayData(todayClim);
      setForecast(nextDays);
    }
  }, [climatology, projectionDays]);

  // Derived Temperature based on Urban Heat Island Effect
  const displayedTemp = useMemo(() => {
    if (!todayData) return 0;
    // Formula: BaseTemp + (UrbanFactor * 2.5)
    return todayData.avgTemp + (urbanFactor * 2.5);
  }, [todayData, urbanFactor]);

  // 2. Trigger AI Insight only when forecast matches the selected projection days
  useEffect(() => {
    if (!todayData || forecast.length === 0) return;
    
    // Race Condition Guard: Ensure forecast data length matches the requested projection
    if (forecast.length !== projectionDays) return;

    // Calculate forecast averages for AI context
    const avgForecastTemp = forecast.reduce((acc, day) => acc + day.avgTemp, 0) / forecast.length;
    const avgForecastPrecip = forecast.reduce((acc, day) => acc + day.avgPrecip, 0) / forecast.length;

    setLoadingAI(true);
    fetchWeatherInsights(
      location.lat,
      location.lon,
      displayedTemp, // Send adjusted temp to AI
      todayData.avgPrecip,
      new Date().toDateString(),
      searchQuery ? searchQuery : undefined,
      { 
        days: projectionDays, 
        avgTemp: avgForecastTemp + (urbanFactor * 2.5), // Adjust forecast average too for AI context
        avgPrecip: avgForecastPrecip 
      }
    ).then(res => {
      setInsight(res);
      setLoadingAI(false);
    });
  }, [location, todayData, projectionDays, forecast, urbanFactor]); // Added urbanFactor dependency

  // Calculate dynamic UV Index based on precipitation (cloud cover proxy)
  const { uvIndex, uvCategory } = useMemo(() => {
    if (!todayData) return { uvIndex: 0, uvCategory: 'N/A' };
    
    // Heuristic: Higher precip -> Lower UV. Base tropical UV ~9.
    const precipFactor = Math.min(todayData.avgPrecip * 2, 8); 
    const calculatedUV = Math.max(1, Math.round(9 - precipFactor));
    
    let category = "Low";
    if (calculatedUV > 2) category = "Moderate";
    if (calculatedUV > 5) category = "High";
    if (calculatedUV > 7) category = "Very High";
    if (calculatedUV > 10) category = "Extreme";

    return { uvIndex: calculatedUV, uvCategory: category };
  }, [todayData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayData || !searchQuery.trim()) return;
    setLoadingAI(true);
    setActiveLocationName(searchQuery);
    
    const avgForecastTemp = forecast.reduce((acc, day) => acc + day.avgTemp, 0) / (forecast.length || 1);
    const avgForecastPrecip = forecast.reduce((acc, day) => acc + day.avgPrecip, 0) / (forecast.length || 1);

    fetchWeatherInsights(
        location.lat,
        location.lon,
        displayedTemp,
        todayData.avgPrecip,
        new Date().toDateString(),
        searchQuery,
        { 
            days: projectionDays, 
            avgTemp: avgForecastTemp, 
            avgPrecip: avgForecastPrecip 
        }
      ).then(res => {
        setInsight(res);
        setLoadingAI(false);
      });
  };

  const handleUploadComplete = (csvData: string) => {
    setShowUploader(false);
    onFileUpload(csvData);
  };

  const getProjectionTitle = () => {
    switch(projectionDays) {
      case 7: return "7-Day Outlook";
      case 14: return "2-Week Forecast";
      case 28: return "Monthly Trend";
      default: return "Projection";
    }
  };

  const PROJECTION_OPTIONS = [
    { value: 7, label: '1W' },
    { value: 14, label: '2W' },
    { value: 28, label: '4W' }
  ];

  // Helper for Bento Grid responsiveness
  const gridClasses = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto p-4 md:p-8";

  if (!todayData) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono tracking-widest animate-pulse">
        INITIALIZING ORBITAL MODEL...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
      {/* Upload Modal */}
      <AnimatePresence>
        {showUploader && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl relative">
              <button onClick={() => setShowUploader(false)} className="absolute -top-12 right-0 text-slate-400 hover:text-white">Close</button>
              <WeatherCard className="bg-slate-900/90">
                <FileUploader onDataLoaded={handleUploadComplete} />
              </WeatherCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">System Nominal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mission Command</h1>
          <p className="text-slate-500 text-sm">Welcome back, <span className="text-cyan-400">{user.name}</span></p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdQ1QRenj1VuuH3raPdpDQLEybL3MEr4_nrjA4movsGNtpvIg/viewform?usp=sharing&ouid=102995987645792571597"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 ring-1 ring-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all"
          >
            <MessageSquare size={14} /> Feedback
          </a>
          <button 
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-xs font-medium transition-all"
          >
            <Upload size={14} /> Import
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20 text-rose-400 text-xs font-medium transition-all"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden px-4 mb-4">
        <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/10">
          <button 
            onClick={() => setMobileTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mobileTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard size={16} /> Mission Data
          </button>
          <button 
            onClick={() => setMobileTab('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mobileTab === 'map' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe size={16} /> Global Sat-Map
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <main className={gridClasses}>
        
        {/* Main Temperature - Large Card */}
        <WeatherCard 
          className={`col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 min-h-[300px] flex flex-col justify-between ${mobileTab === 'map' ? 'hidden md:flex' : 'flex'}`}
          delay={0.1}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-widest mb-1">Projected Temp</h2>
              <div className="text-xs text-slate-400">Historical Regression Model (Urban Corrected)</div>
            </div>
            <Thermometer className="text-rose-500" size={24} />
          </div>
          
          <div className="mt-4">
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-bold text-white tracking-tighter shadow-cyan-500/50 drop-shadow-2xl">
                {displayedTemp.toFixed(1)}°
              </span>
              <div className="flex flex-col">
                <span className="text-2xl text-slate-400">C</span>
                <span className="text-xs text-emerald-400 font-mono">
                  {(urbanFactor * 2.5).toFixed(1)}°C Heat Island
                </span>
              </div>
            </div>
          </div>

          {/* Urban Factor Slider */}
          <div className="mt-4 px-1">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-mono mb-1">
              <span>Rural</span>
              <span>Suburban</span>
              <span>Metro</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={urbanFactor}
              onChange={(e) => setUrbanFactor(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
            />
            <div className="flex items-center gap-2 mt-1">
               <Building2 size={10} className="text-slate-500" />
               <span className="text-[10px] text-slate-400">Urban Density Factor: {urbanFactor}</span>
            </div>
          </div>

          <div className="mt-auto pt-6 grid grid-cols-3 gap-4 border-t border-white/5">
             <div>
                <span className="block text-xs text-slate-500 uppercase">Precip</span>
                <span className="text-lg font-medium text-blue-400">{todayData.avgPrecip} <span className="text-xs">mm</span></span>
             </div>
             <div>
                <span className="block text-xs text-slate-500 uppercase">Humidity</span>
                <span className="text-lg font-medium text-slate-300">~64%</span>
             </div>
             <div>
                <span className="block text-xs text-slate-500 uppercase">Wind</span>
                <span className="text-lg font-medium text-slate-300">12 <span className="text-xs">km/h</span></span>
             </div>
          </div>
        </WeatherCard>

        {/* Map - Medium Card (4 cols, 2 rows) */}
        <div className={`col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 min-h-[400px] relative group rounded-3xl overflow-hidden ring-1 ring-white/10 bg-slate-900 ${mobileTab === 'overview' ? 'hidden md:block' : 'block h-[70vh] md:h-auto'}`}>
          <LocationMap 
            lat={location.lat} 
            lon={location.lon} 
            onLocationSelect={onLocationChange} 
          />
          <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-3xl z-20"></div>
        </div>

        {/* Tactical Mission Planner (Replaces Gemini Wide Card in mobile flow or sits next to it) */}
        <div className={`col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 ${mobileTab === 'map' ? 'hidden md:block' : 'block'}`}>
           <MissionPlanner 
              currentTemp={displayedTemp}
              windSpeed={12} // Using derived average/mock for now as per dashboard data
              precip={todayData.avgPrecip}
              humidity={64}
           />
        </div>

        {/* Gemini Insight - Wide Card (Now moved down or alongside Planner based on grid) */}
        <WeatherCard 
          className={`col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 ${mobileTab === 'map' ? 'hidden md:block' : 'block'}`}
          delay={0.2}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gemini Live Intelligence</h3>
              <p className="text-[10px] text-indigo-300 font-mono uppercase">Real-time Validation</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative mb-6 group">
            <input 
              type="text" 
              placeholder="Compare with location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 pl-4 pr-10 text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-200 placeholder-slate-600"
            />
            <button type="submit" className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors">
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="space-y-4">
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                <Activity className="animate-spin mb-2" />
                <span className="text-xs font-mono">ESTABLISHING UPLINK...</span>
              </div>
            ) : insight ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-slate-400 uppercase">
                    Target: {activeLocationName}
                  </span>
                  {insight.condition && (
                    <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded uppercase">
                      {insight.condition}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3">
                  "{insight.summary}"
                </p>
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-1">Tactical Advice</div>
                  <p className="text-xs text-slate-400">{insight.advice}</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 text-center py-8">
                Ready for query.
              </div>
            )}
          </div>
        </WeatherCard>

        {/* Small Stat Cards Group - Hidden on mobile map tab */}
        <div className={`col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${mobileTab === 'map' ? 'hidden md:grid' : 'grid'}`}>
            <WeatherCard 
              title="Data Points" 
              value={todayData.count} 
              icon={Activity}
              className="col-span-1"
              delay={0.3}
            />
            <WeatherCard 
              title="Season Day" 
              value={todayData.doy} 
              subtitle="of 365"
              icon={Calendar}
              className="col-span-1"
              delay={0.35}
            />
            <WeatherCard 
              title="UV Index" 
              value={uvIndex} 
              subtitle={uvCategory}
              icon={Sun}
              trend="neutral"
              trendValue="Avg"
              className="col-span-1"
              delay={0.38}
            />
            <WeatherCard 
              title="Precip Probability" 
              value={`${(todayData.avgPrecip * 10).toFixed(0)}%`}
              icon={CloudRain}
              trend={todayData.avgPrecip > 5 ? 'up' : 'neutral'}
              trendValue="High"
              className="col-span-1"
              delay={0.45}
            />
        </div>

        {/* Charts - Wide Card */}
        <WeatherCard className={`col-span-1 md:col-span-2 lg:col-span-12 min-h-[400px] ${mobileTab === 'map' ? 'hidden md:block' : 'block'}`} delay={0.5}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><Activity size={20}/></div>
               <div>
                 <h3 className="text-lg font-bold text-white">Projection</h3>
                 <p className="text-xs text-slate-500 font-mono">{getProjectionTitle()}</p>
               </div>
             </div>
             
             {/* Projection Toggle */}
             <div className="flex items-center gap-4">
                <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
                  {PROJECTION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setProjectionDays(opt.value as any)}
                      className={`relative px-4 py-1.5 text-xs font-mono rounded-md transition-all duration-300 ${
                        projectionDays === opt.value 
                          ? 'text-cyan-400 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {projectionDays === opt.value && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-cyan-500/10 rounded-md border border-cyan-500/20"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="hidden sm:flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">Temp</span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">Precip</span>
                </div>
             </div>
          </div>
          <div className="h-[300px] w-full">
             <WeatherCharts forecastData={forecast} />
          </div>
        </WeatherCard>

      </main>
    </div>
  );
};

export default Dashboard;