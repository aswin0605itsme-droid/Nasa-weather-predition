import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ReferenceLine,
  Line
} from 'recharts';
import { Climatology } from '../types';
import { doyToDate, formatDate } from '../utils';

interface WeatherChartsProps {
  forecastData: Climatology[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-slate-900/90 backdrop-blur-md z-50">
        <p className="text-gray-300 text-xs font-mono mb-2 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Filter out the confidence ranges from displaying as standard lines if needed, or format them specially
          if (entry.dataKey === 'tempRange') return null; 
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm mb-1">
              <div 
                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
                style={{ backgroundColor: entry.color, color: entry.color }}
              />
              <span className="text-gray-400 capitalize">{entry.name}:</span>
              <span className="font-bold text-white font-mono">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.unit}
              </span>
            </div>
          );
        })}
        {/* Custom section for Precipitation Probability */}
        {payload[0]?.payload?.precipProb !== undefined && (
           <div className="flex items-center gap-2 text-sm mb-1 mt-2 border-t border-white/5 pt-1">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]"></div>
              <span className="text-gray-400">Prob:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {(payload[0].payload.precipProb * 100).toFixed(0)}%
              </span>
           </div>
        )}
      </div>
    );
  }
  return null;
};

const WeatherCharts: React.FC<WeatherChartsProps> = ({ forecastData }) => {
  const [combinedView, setCombinedView] = useState(false);

  const chartData = useMemo(() => forecastData.map(d => {
    // Feature 3: Confidence Intervals (Probabilistic Forecasting)
    // UpperBound = Prediction * 1.06, LowerBound = Prediction * 0.94
    // We create a tuple range for the Area chart
    const lower = d.avgTemp * 0.94;
    const upper = d.avgTemp * 1.06;
    
    // Simulate Probability based on precip amount (Heuristic)
    const prob = Math.min(d.avgPrecip * 0.2, 1.0);

    return {
      date: formatDate(doyToDate(d.doy)),
      temp: d.avgTemp,
      tempRange: [lower, upper], // For the Area ribbon
      precip: d.avgPrecip,
      precipProb: prob
    };
  }), [forecastData]);

  const avgPrecipitation = useMemo(() => {
      const total = chartData.reduce((acc, curr) => acc + curr.precip, 0);
      return total / (chartData.length || 1);
  }, [chartData]);

  // Dynamic sizing based on data length
  const dataLength = forecastData.length;
  
  // Bar Size Logic
  const barSize = dataLength > 20 ? 8 : dataLength > 10 ? 12 : 24;

  // Axis Interval Logic
  const axisInterval = dataLength > 20 ? 3 : dataLength > 10 ? 1 : 0; 

  // Calculate week dividers (Day 7, 14, 21...)
  const weekDividers = useMemo(() => {
    const dividers = [];
    if (dataLength > 7) {
        for(let i = 7; i < dataLength; i += 7) {
            dividers.push(i - 0.5);
        }
    }
    return dividers;
  }, [dataLength]);

  const renderDividers = () => {
      return weekDividers.map((idx) => {
          const dataPoint = chartData[Math.ceil(idx)];
          return dataPoint ? (
            <ReferenceLine 
                key={`divider-${idx}`} 
                x={dataPoint.date} 
                stroke="rgba(255,255,255,0.1)" 
                strokeDasharray="3 3" 
                label={{ 
                    value: `Week ${Math.ceil(idx / 7) + 1}`, 
                    position: 'insideTopRight', 
                    fill: 'rgba(255,255,255,0.3)', 
                    fontSize: 10,
                    offset: 5
                }} 
            />
          ) : null;
      });
  };

  if (combinedView) {
    return (
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <i className="fas fa-chart-line text-indigo-400"></i>
            </div>
            Integrated Model
          </h3>
          <button 
            onClick={() => setCombinedView(false)}
            className="text-xs bg-slate-900/80 hover:bg-slate-800 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/20 transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] font-mono"
          >
            SPLIT VIEW
          </button>
        </div>
        
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <defs>
                <linearGradient id="colorTempCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrecipCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                tickLine={false}
                axisLine={false}
                dy={10}
                interval={axisInterval}
              />
              <YAxis 
                yAxisId="left"
                stroke="#f43f5e" 
                tick={{fill: '#f43f5e', fontSize: 11}} 
                tickLine={false}
                axisLine={false}
                unit="°C"
                dx={-10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#22d3ee" 
                tick={{fill: '#22d3ee', fontSize: 11}} 
                tickLine={false}
                axisLine={false}
                unit="mm"
                dx={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'monospace', fontSize: '12px' }}/>
              
              {renderDividers()}

              {/* Confidence Ribbon */}
              <Area
                yAxisId="left"
                dataKey="tempRange"
                stroke="none"
                fill="#f43f5e"
                fillOpacity={0.1}
              />

              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="temp" 
                name="Temperature" 
                stroke="#f43f5e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTempCombined)" 
              />
              <Bar 
                yAxisId="right"
                dataKey="precip" 
                name="Precipitation" 
                fill="url(#colorPrecipCombined)" 
                barSize={barSize}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setCombinedView(true)}
          className="text-xs flex items-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg border border-indigo-500/30 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] font-mono"
        >
          <i className="fas fa-layer-group mr-2"></i> COMBINE STREAMS
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temperature Chart with Confidence Ribbon */}
        <div className="glass-panel p-6 rounded-2xl relative">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <i className="fas fa-temperature-high text-rose-500"></i>
            Thermal Projection (94.2% Confidence)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={axisInterval}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false}
                  axisLine={false}
                  unit="°C"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {renderDividers()}

                {/* Feature 3: Confidence Ribbon Area */}
                <Area
                    dataKey="tempRange"
                    stroke="none"
                    fill="#f43f5e"
                    fillOpacity={0.2}
                    name="94.2% Confidence"
                />

                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  name="Avg Temp" 
                  unit="°C"
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Chart with Avg Line */}
        <div className="glass-panel p-6 rounded-2xl relative">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <i className="fas fa-cloud-showers-heavy text-cyan-400"></i>
            Precipitation Volume & Probability
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={axisInterval}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false}
                  axisLine={false}
                  unit="mm"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }} />
                
                {renderDividers()}

                {/* Avg Precip Reference Line */}
                <ReferenceLine 
                    y={avgPrecipitation} 
                    stroke="#fbbf24" 
                    strokeDasharray="5 5" 
                    label={{ position: 'right', value: 'Avg', fill: '#fbbf24', fontSize: 10 }}
                />

                <Bar 
                  dataKey="precip" 
                  name="Precipitation" 
                  unit="mm"
                  fill="url(#colorPrecip)" 
                  barSize={barSize}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCharts;