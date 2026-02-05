import React, { useEffect, useState, useMemo } from 'react';
import { Climatology, AIInsight, User } from '../types';
import { getForecast, getDayOfYear, doyToDate, formatDate } from '../utils';
import WeatherCharts from './WeatherCharts';
import { fetchWeatherInsights } from '../services/geminiService';
import LocationMap from './LocationMap';
import FileUploader from './FileUploader';
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

const Dashboard: React.FC<DashboardProps> = ({ climatology, location, onLocationChange, onLogout, user, onFileUpload }) => {
  const [todayData, setTodayData] = useState<Climatology | null>(null);
  const [forecast, setForecast] = useState<Climatology[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationName, setActiveLocationName] = useState('Selected Sector');
  const [showUploader, setShowUploader] = useState(false);

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

  const handleUploadComplete = (csvData: string) => {
    setShowUploader(false);
    onFileUpload(csvData);
  };

  if (!todayData) return (
    <div className="flex items-center justify-center h-64 text-space-cyan font-mono animate-pulse">
        Calculating Climatology...
    </div>
  );

  const currentDate = formatDate(new Date());
  const accuracyMetrics = calculateAccuracy();

  return (
    <div className="animate-fade-in pb-12 relative">
      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-space-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-space-900 border border-space-700 rounded-2xl shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowUploader(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <FileUploader onDataLoaded={handleUploadComplete} />
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Mission Command</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">
            Welcome back, <span className="text-space-cyan">{user.name}</span>. Systems nominal.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdQ1QRenj1VuuH3raPdpDQLEybL3MEr4_nrjA4movsGNtpvIg/viewform?usp=publish-editor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass-panel hover:bg-space-800 text-gray-300 px-5 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap flex items-center gap-2 hover:text-white group"
            >
              <i className="fas fa-comment-alt text-space-accent group-hover:scale-110 transition-transform"></i> Feedback
            </a>
            <button 
            onClick={onLogout}
            className="px-5 py-2.5 rounded-lg text-sm bg-space-rose/10 text-space-rose border border-space-rose/30 hover:bg-space-rose/20 transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] whitespace-nowrap"
            >
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left Column: Map & Historical Data (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           {/* Map Card */}
           <div className="glass-panel rounded-2xl overflow-hidden h-72 relative group transition-all duration-300 shadow-lg">
             <LocationMap 
               lat={location.lat} 
               lon={location.lon} 
               onLocationSelect={onLocationChange} 
             />
             <div className="absolute top-4 right-4 bg-space-950/90 backdrop-blur-md text-[10px] font-mono text-space-cyan px-3 py-1.5 rounded border border-space-cyan/20 shadow-lg">
                LAT: {location.lat.toFixed(4)} <br/> LON: {location.lon.toFixed(4)}
             </div>
             <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-space-950/90 to-transparent pointer-events-none"></div>
             <div className="absolute bottom-4 left-4 pointer-events-none">
                <span className="text-white text-xs font-bold tracking-widest uppercase bg-space-accent/20 px-2 py-1 rounded border border-space-accent/30">
                    Sector View
                </span>
             </div>
           </div>

           {/* Historical Prediction Card */}
           <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-history text-6xl text-white"></i>
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Historical Prediction</h3>
                  <div className="text-space-cyan text-[10px] font-mono">MODEL: MERRA-2 REGRESSION</div>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white tracking-tighter">{todayData.avgTemp.toFixed(1)}</span>
              <span className="text-2xl text-gray-400 font-light">°C</span>
            </div>
            
            <div className="mt-6 flex items-center justify-between p-3 bg-space-900/50 rounded-lg border border-white/5">
              <div className="flex items-center text-blue-400">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                    <i className="fas fa-tint"></i>
                </div>
                <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold">Precipitation</span>
                    <span className="font-mono text-lg text-white">{todayData.avgPrecip} <span className="text-xs text-gray-500">mm</span></span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                <i className="fas fa-database"></i>
                <span>Based on {todayData.count} years of orbital data.</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Accuracy (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Insight Card */}
          <div className="glass-panel rounded-2xl p-8 relative min-h-[280px] flex flex-col justify-between border-t-2 border-t-space-accent/50">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-space-accent/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-space-accent to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <i className="fas fa-robot text-white"></i>
                </div>
                <div>
                    <h3 className="text-white text-lg font-bold tracking-tight">Gemini Live Intelligence</h3>
                    <p className="text-xs text-space-accent font-mono uppercase tracking-wider">
                        Real-time Validation
                    </p>
                </div>
              </div>
              
              <form onSubmit={handleSearch} className="flex w-full sm:w-auto relative group">
                <input 
                    type="text" 
                    placeholder="Compare with City..." 
                    className="bg-space-950/50 backdrop-blur-sm text-sm text-white px-4 py-2.5 pl-10 rounded-lg border border-space-700 focus:border-space-cyan focus:ring-1 focus:ring-space-cyan outline-none w-full sm:w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-space-cyan transition-colors">
                    <i className="fas fa-search"></i>
                </div>
              </form>
            </div>
            
            <div className="relative z-10 flex-grow">
                {loadingAI ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-8">
                    <i className="fas fa-satellite-dish text-3xl mb-4 text-space-cyan animate-pulse"></i>
                    <span className="font-mono text-sm tracking-widest">ESTABLISHING UPLINK...</span>
                </div>
                ) : insight ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-space-950 text-gray-400 px-2 py-1 rounded border border-space-800 uppercase tracking-wider">
                            TARGET: {activeLocationName === '' ? 'STATION SECTOR' : activeLocationName}
                        </span>
                        {insight.condition && (
                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-wider">
                                {insight.condition}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-white text-xl font-light leading-relaxed">
                    "{insight.summary}"
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-space-950/30 rounded-lg p-4 border border-white/5">
                            <strong className="text-space-cyan text-xs uppercase tracking-widest block mb-2">Model Deviation</strong>
                            <p className="text-sm text-gray-300 leading-relaxed">{insight.realTimeComparison}</p>
                        </div>
                        <div className="bg-space-950/30 rounded-lg p-4 border border-white/5">
                            <strong className="text-green-400 text-xs uppercase tracking-widest block mb-2">Tactical Advice</strong>
                            <p className="text-sm text-gray-300 leading-relaxed">{insight.advice}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2 overflow-x-auto pb-1">
                    {insight.sources.map((source, i) => (
                        <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors bg-space-950 px-2 py-1 rounded border border-space-800 whitespace-nowrap">
                        <i className="fas fa-external-link-alt text-[8px]"></i>
                        {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                        </a>
                    ))}
                    </div>
                </div>
                ) : (
                <div className="text-space-rose text-sm border border-space-rose/20 bg-space-rose/5 p-4 rounded-lg">
                    <i className="fas fa-times-circle mr-2"></i>
                    AI Analysis Uplink Failed. Retry manually.
                </div>
                )}
            </div>
          </div>

          {/* Accuracy Meter Widget */}
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-chart-area text-space-cyan"></i> 
                    Diurnal Cycle Comparison
                </h3>
                {accuracyMetrics && (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold">Accuracy Score</span>
                            <span className={`text-xl font-bold font-mono ${accuracyMetrics.score > 85 ? 'text-green-400' : accuracyMetrics.score > 70 ? 'text-yellow-400' : 'text-space-rose'}`}>
                                {accuracyMetrics.score}%
                            </span>
                        </div>
                    </div>
                )}
             </div>
             
             {loadingAI ? (
                <div className="h-40 flex items-center justify-center text-gray-600 font-mono text-xs">
                   [ WAITING FOR TELEMETRY ]
                </div>
             ) : accuracyMetrics ? (
                <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={diurnalData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis 
                                dataKey="time" 
                                stroke="#475569" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                interval={2} 
                                fontFamily="monospace"
                            />
                            <YAxis 
                                hide 
                                domain={['auto', 'auto']} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0B0E17', borderColor: '#334155', fontSize: '12px', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value}°C`, '']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Historical" 
                                name="Historical Model"
                                stroke="#64748b" 
                                strokeDasharray="4 4" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorHist)" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Actual" 
                                name="Real-Time Adjusted"
                                stroke="#22d3ee" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorActual)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-8 mt-2 text-[10px] uppercase font-bold tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 bg-slate-500/50 rounded-full"></div>
                            <span className="text-slate-500">Historical Model</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 bg-space-cyan rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                            <span className="text-space-cyan">Live Reality</span>
                        </div>
                    </div>
                </div>
             ) : (
                <div className="h-40 flex items-center justify-center text-gray-500 text-sm italic bg-space-950/30 rounded-xl border border-white/5 border-dashed">
                    Waiting for real-time data input...
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-space-cyan to-transparent rounded-full"></span>
            7-Day Historical Projection
        </h2>
        <WeatherCharts forecastData={forecast} />
      </div>

      {/* Raw Stats */}
      <div className="glass-panel rounded-2xl p-6 border-t border-t-white/10">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Dataset Metadata</h3>
            <button 
                onClick={() => setShowUploader(true)}
                className="text-xs bg-space-700 hover:bg-space-600 text-white px-4 py-2 rounded-lg border border-space-600 transition-all hover:shadow-lg flex items-center gap-2"
            >
                <i className="fas fa-upload"></i> Import New Dataset
            </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-space-950/50 rounded-xl border border-white/5">
            <span className="block text-gray-500 text-[10px] uppercase tracking-widest mb-1">Source</span>
            <span className="text-white font-medium">NASA/POWER MERRA-2</span>
          </div>
          <div className="p-4 bg-space-950/50 rounded-xl border border-white/5">
            <span className="block text-gray-500 text-[10px] uppercase tracking-widest mb-1">Coordinates</span>
            <span className="text-white font-medium font-mono">13.1186, 80.1083</span>
          </div>
          <div className="p-4 bg-space-950/50 rounded-xl border border-white/5">
            <span className="block text-gray-500 text-[10px] uppercase tracking-widest mb-1">Temporal Range</span>
            <span className="text-white font-medium">2000 - 2023</span>
          </div>
          <div className="p-4 bg-space-950/50 rounded-xl border border-white/5">
            <span className="block text-gray-500 text-[10px] uppercase tracking-widest mb-1">Algorithm</span>
            <span className="text-space-cyan font-medium">Weighted OLS Regression</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;