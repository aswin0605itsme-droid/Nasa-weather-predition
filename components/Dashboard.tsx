import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, 
  CloudRain, 
  Wind, 
  Droplets, 
  Map as MapIcon, 
  Bot, 
  ArrowRight, 
  LogOut, 
  Upload, 
  Activity,
  Calendar
} from 'lucide-react';
import { Climatology, AIInsight, User } from '../types';
import { getForecast, getDayOfYear, doyToDate, formatDate } from '../utils';
import WeatherCharts from './WeatherCharts';
import { fetchWeatherInsights } from '../services/geminiService';
import LocationMap from './LocationMap';
import FileUploader from './FileUploader';
import WeatherCard from './WeatherCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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

  useEffect(() => {
    const todayDOY = getDayOfYear(new Date());
    const todayClim = climatology.get(todayDOY);
    const nextWeek = getForecast(climatology, todayDOY, 7);

    if (todayClim) {
      setTodayData(todayClim);
      setForecast(nextWeek);
    }
  }, [climatology]);

  useEffect(() => {
    if (!todayData) return;

    setLoadingAI(true);
    fetchWeatherInsights(
      location.lat,
      location.lon,
      todayData.avgTemp,
      todayData.avgPrecip,
      new Date().toDateString(),
      searchQuery ? searchQuery : undefined
    ).then(res => {
      setInsight(res);
      setLoadingAI(false);
    });
  }, [location, todayData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayData || !searchQuery.trim()) return;
    setLoadingAI(true);
    setActiveLocationName(searchQuery);
    fetchWeatherInsights(
        location.lat,
        location.lon,
        todayData.avgTemp,
        todayData.avgPrecip,
        new Date().toDateString(),
        searchQuery
      ).then(res => {
        setInsight(res);
        setLoadingAI(false);
      });
  };

  const handleUploadComplete = (csvData: string) => {
    setShowUploader(false);
    onFileUpload(csvData);
  };

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
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-xs font-medium transition-all"
          >
            <Upload size={14} /> Import Data
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20 text-rose-400 text-xs font-medium transition-all"
          >
            <LogOut size={14} /> Abort
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <main className={gridClasses}>
        
        {/* Main Temperature - Large Card (4 cols, 2 rows) */}
        <WeatherCard 
          className="col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 min-h-[300px] flex flex-col justify-between"
          delay={0.1}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-widest mb-1">Projected Temp</h2>
              <div className="text-xs text-slate-500">Historical Regression Model</div>
            </div>
            <Thermometer className="text-rose-500" size={24} />
          </div>
          
          <div className="mt-8">
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-bold text-white tracking-tighter shadow-cyan-500/50 drop-shadow-2xl">
                {todayData.avgTemp.toFixed(1)}°
              </span>
              <div className="flex flex-col">
                <span className="text-2xl text-slate-400">C</span>
                <span className="text-xs text-emerald-400 font-mono">▲ 1.2% vs Avg</span>
              </div>
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
        <div className="col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 relative group rounded-3xl overflow-hidden ring-1 ring-white/10 bg-slate-900">
          <LocationMap 
            lat={location.lat} 
            lon={location.lon} 
            onLocationSelect={onLocationChange} 
          />
          <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-3xl z-20"></div>
          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-mono text-slate-300">LIVE TRACKING</span>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-right">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest">Coordinates</div>
             <div className="text-xs font-mono text-cyan-400">{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</div>
          </div>
        </div>

        {/* Gemini Insight - Wide Card (4 cols, 2 rows - vertical on mobile, stacked) */}
        <WeatherCard 
          className="col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-2 bg-gradient-to-br from-indigo-950/30 to-purple-950/30"
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

        {/* Small Stat Cards (1 col each) - Row 3 */}
        <WeatherCard 
          title="Data Points" 
          value={todayData.count} 
          icon={Activity}
          className="col-span-1 md:col-span-1 lg:col-span-3"
          delay={0.3}
        />
        <WeatherCard 
          title="Season Day" 
          value={todayData.doy} 
          subtitle="of 365"
          icon={Calendar}
          className="col-span-1 md:col-span-1 lg:col-span-3"
          delay={0.35}
        />
        <WeatherCard 
          title="Model Confidence" 
          value="94.2%" 
          trend="up" 
          trendValue="0.4%"
          className="col-span-1 md:col-span-1 lg:col-span-3"
          delay={0.4}
        />
        <WeatherCard 
          title="Precip Probability" 
          value={`${(todayData.avgPrecip * 10).toFixed(0)}%`}
          icon={CloudRain}
          trend={todayData.avgPrecip > 5 ? 'up' : 'neutral'}
          trendValue="High"
          className="col-span-1 md:col-span-1 lg:col-span-3"
          delay={0.45}
        />

        {/* Charts - Wide Card (12 cols) */}
        <WeatherCard className="col-span-1 md:col-span-2 lg:col-span-12 min-h-[400px]" delay={0.5}>
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><Activity size={20}/></div>
               <h3 className="text-lg font-bold text-white">7-Day Projection</h3>
             </div>
             <div className="flex gap-2">
               <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium">Temp</span>
               <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">Precip</span>
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