import React, { useEffect, useState, useMemo } from 'react';
import { Climatology, AIInsight, User } from '../types';
import { getForecast, getDayOfYear, doyToDate, formatDate } from '../utils';
import WeatherCharts from './WeatherCharts';
import { fetchWeatherInsights } from '../services/geminiService';
import LocationMap from './LocationMap';
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
}

// Helper to generate simulated diurnal cycle data for the chart
const generateDiurnalData = (baseTemp: number, currentTemp?: number) => {
  const data = [];
  const currentHour = new Date().getHours();
  
  // Heuristic: Temp swings ~10°C daily. Lowest at 4AM, Highest at 2PM (14:00)
  const amplitude = 5; 
  
  // Function to get normalized cycle (-1 to 1) based on hour, peak at 14:00
  const getCycle = (h: number) => Math.sin(((h - 8) / 24) * 2 * Math.PI);
  
  // Calculate offset if we have real-time data
  let realTimeOffset = 0;
  if (currentTemp !== undefined) {
      const modelAtCurrentHour = baseTemp + (amplitude * getCycle(currentHour));
      realTimeOffset = currentTemp - modelAtCurrentHour;
  }

  for (let i = 0; i <= 24; i += 3) {
    const hourLabel = `${i.toString().padStart(2, '0')}:00`;
    const cycleVal = getCycle(i);
    const historical = baseTemp + (amplitude * cycleVal);
    // Apply the known offset to the whole curve to show the trend difference
    const actual = currentTemp !== undefined ? historical + realTimeOffset : null;

    data.push({
      time: hourLabel,
      Historical: parseFloat(historical.toFixed(1)),
      Actual: actual ? parseFloat(actual.toFixed(1)) : null,
    });
  }
  return data;
};

const Dashboard: React.FC<DashboardProps> = ({ climatology, location, onLocationChange, onLogout, user }) => {
  const [todayData, setTodayData] = useState<Climatology | null>(null);
  const [forecast, setForecast] = useState<Climatology[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationName, setActiveLocationName] = useState('Selected Sector');

  // Load historical data for today
  useEffect(() => {
    const todayDOY = getDayOfYear(new Date());
    const todayClim = climatology.get(todayDOY);
    const nextWeek = getForecast(climatology, todayDOY, 7);

    if (todayClim) {
      setTodayData(todayClim);
      setForecast(nextWeek);
    }
  }, [climatology]);

  // Fetch AI insight when location or date changes
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

  const calculateAccuracy = () => {
    if (!insight?.currentTemp || !todayData) return null;
    
    const diff = Math.abs(todayData.avgTemp - insight.currentTemp);
    // Formula: 100 - percent_error
    let accuracy = 100 - (diff / Math.abs(todayData.avgTemp || 1)) * 100;
    if (accuracy < 0) accuracy = 0;
    if (accuracy > 100) accuracy = 100;
    
    return {
      score: Math.round(accuracy),
      diff: parseFloat(diff.toFixed(1)),
      direction: insight.currentTemp > todayData.avgTemp ? 'warmer' : 'cooler'
    };
  };

  const diurnalData = useMemo(() => {
    if (!todayData) return [];
    return generateDiurnalData(todayData.avgTemp, insight?.currentTemp);
  }, [todayData, insight]);

  if (!todayData) return <div>Loading analysis...</div>;

  const currentDate = formatDate(new Date());
  const accuracyMetrics = calculateAccuracy();

  return (
    <div className="animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mission Command</h1>
          <p className="text-space-accent mt-1 text-sm">
            Welcome back, <span className="font-semibold">{user.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdQ1QRenj1VuuH3raPdpDQLEybL3MEr4_nrjA4movsGNtpvIg/viewform?usp=publish-editor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-space-800 hover:bg-space-700 text-gray-300 border border-space-600 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap flex items-center"
            >
              <i className="fas fa-comment-alt mr-2 text-space-accent"></i> Feedback
            </a>
            <button 
            onClick={onLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ml-auto"
            >
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Map & Historical Data */}
        <div className="space-y-6">
           {/* Map Card */}
           <div className="bg-space-800 rounded-xl border border-space-700 shadow-xl overflow-hidden h-64 relative group">
             <LocationMap 
               lat={location.lat} 
               lon={location.lon} 
               onLocationSelect={onLocationChange} 
             />
             <div className="absolute bottom-2 left-2 bg-space-900/90 text-[10px] text-gray-400 px-2 py-1 rounded border border-space-700 pointer-events-none">
                Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
             </div>
           </div>

           {/* Historical Prediction Card */}
           <div className="bg-space-800 rounded-xl p-6 border border-space-700 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Historical Model</h3>
              <i className="fas fa-file-csv text-space-accent"></i>
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">{todayData.avgTemp}°C</span>
              <span className="ml-2 text-sm text-gray-400">Avg Range</span>
            </div>
            <div className="mt-4 flex items-center text-blue-400">
              <i className="fas fa-tint mr-2"></i>
              <span className="font-medium">{todayData.avgPrecip} mm</span>
              <span className="ml-2 text-xs text-gray-500">Avg Precip</span>
            </div>
            <div className="mt-4 pt-4 border-t border-space-700">
              <p className="text-xs text-gray-400">
                  <i className="fas fa-info-circle mr-1"></i>
                  Prediction based on weighted analysis of {todayData.count} years of NASA MERRA-2 data.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Accuracy */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Accuracy Meter Widget */}
          <div className="bg-space-800 rounded-xl p-6 border border-space-700 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-crosshairs text-green-400"></i> Model Accuracy
                </h3>
                {accuracyMetrics && (
                    <span className={`text-xl font-bold ${accuracyMetrics.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {accuracyMetrics.score}%
                    </span>
                )}
             </div>
             
             {loadingAI ? (
                <div className="h-40 flex items-center justify-center text-gray-500 animate-pulse text-sm flex-col">
                   <i className="fas fa-satellite text-2xl mb-2 text-space-accent"></i>
                   Calibrating sensors...
                </div>
             ) : accuracyMetrics ? (
                <div className="w-full h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={diurnalData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d0d6f9" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#d0d6f9" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4b5563" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#4b5563" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                            <XAxis 
                                dataKey="time" 
                                stroke="#6b7280" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                interval={1} 
                            />
                            <YAxis 
                                hide 
                                domain={['auto', 'auto']} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', fontSize: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Historical" 
                                stroke="#6b7280" 
                                strokeDasharray="4 4" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorHist)" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Actual" 
                                stroke="#d0d6f9" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorActual)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-2 text-[10px] uppercase font-bold tracking-wider">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-500 opacity-50"></div>
                            <span className="text-gray-500">Predicted (NASA)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-space-accent"></div>
                            <span className="text-space-accent">Real-Time (AI)</span>
                        </div>
                    </div>
                </div>
             ) : (
                <div className="h-40 flex items-center justify-center text-gray-500 text-sm italic bg-space-900/30 rounded-lg">
                    Waiting for real-time data...
                </div>
             )}
          </div>

          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-space-800 to-space-700 rounded-xl p-6 border border-space-700 shadow-xl relative min-h-[200px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-space-accent text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-satellite-dish"></i> Live Intelligence
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                    Validating historical model against real-time web data.
                </p>
              </div>
              
              <form onSubmit={handleSearch} className="flex w-full sm:w-auto relative group">
                <input 
                    type="text" 
                    placeholder="Search any city..." 
                    className="bg-space-900/80 text-sm text-white px-4 py-2 pr-10 rounded-lg border border-space-600 focus:border-space-accent focus:outline-none w-full sm:w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-0 top-0 h-full px-3 text-space-accent hover:text-white transition-colors">
                    <i className="fas fa-search"></i>
                </button>
              </form>
            </div>
            
            {loadingAI ? (
              <div className="h-24 flex items-center justify-center text-gray-500 animate-pulse">
                Scanning satellite data for {activeLocationName}...
              </div>
            ) : insight ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-space-900 text-space-accent px-2 py-0.5 rounded border border-space-600 uppercase">
                        {activeLocationName === '' ? 'Station Sector' : activeLocationName}
                    </span>
                </div>
                <p className="text-white text-lg font-light leading-relaxed">
                  {insight.summary}
                </p>
                <div className="bg-space-900/50 rounded-lg p-3 text-sm text-gray-300 border border-space-700/50">
                  <strong className="text-space-accent block mb-1">
                      Data Science vs Reality:
                  </strong>
                  {insight.realTimeComparison}
                </div>
                {insight.condition && (
                    <div className="inline-block bg-space-900 px-3 py-1 rounded-full text-xs text-blue-300 border border-blue-500/30">
                        <i className="fas fa-cloud mr-1"></i> {insight.condition}
                    </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {insight.sources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors underline">
                      {source.title.substring(0, 30)}...
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-400 text-sm">Failed to load AI insights.</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <h2 className="text-2xl font-bold text-white mb-4">7-Day Historical Projection</h2>
      <WeatherCharts forecastData={forecast} />

      {/* Raw Stats */}
      <div className="mt-8 bg-space-800 rounded-xl border border-space-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dataset Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-space-900 rounded-lg">
            <span className="block text-gray-500 text-xs">Source</span>
            <span className="text-gray-300">NASA/POWER MERRA-2</span>
          </div>
          <div className="p-3 bg-space-900 rounded-lg">
            <span className="block text-gray-500 text-xs">Station Lat/Lon</span>
            <span className="text-gray-300">13.1186, 80.1083</span>
          </div>
          <div className="p-3 bg-space-900 rounded-lg">
            <span className="block text-gray-500 text-xs">Dataset Range</span>
            <span className="text-gray-300">2000 - 2023</span>
          </div>
          <div className="p-3 bg-space-900 rounded-lg">
            <span className="block text-gray-500 text-xs">Prediction Algorithm</span>
            <span className="text-gray-300">Weighted Moving Average</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;