import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area
} from 'recharts';
import { Climatology } from '../types';
import { doyToDate, formatDate } from '../utils';

interface WeatherChartsProps {
  forecastData: Climatology[];
}

const WeatherCharts: React.FC<WeatherChartsProps> = ({ forecastData }) => {
  const [combinedView, setCombinedView] = useState(false);

  const chartData = forecastData.map(d => ({
    date: formatDate(doyToDate(d.doy)),
    temp: d.avgTemp,
    precip: d.avgPrecip
  }));

  if (combinedView) {
    return (
      <div className="glass-panel p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-space-rose via-space-accent to-space-cyan"></div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fas fa-chart-line text-space-accent"></i>
            Integrated Weather Model
          </h3>
          <button 
            onClick={() => setCombinedView(false)}
            className="text-xs bg-space-800 hover:bg-space-700 px-4 py-2 rounded-lg text-gray-300 transition-colors border border-white/10"
          >
            Switch to Split View
          </button>
        </div>
        <div className="h-[400px] w-full min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorTempCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="#f43f5e" 
                tick={{fill: '#f43f5e', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                unit="°C"
                dx={-10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#22d3ee" 
                tick={{fill: '#22d3ee', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                unit="mm"
                dx={10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B0E17', borderColor: '#334155', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
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
                fill="#22d3ee" 
                barSize={12}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setCombinedView(true)}
          className="text-xs flex items-center bg-space-800 hover:bg-space-700 px-4 py-2 rounded-lg text-white transition-all shadow-lg border border-white/10 hover:border-space-accent/50"
        >
          <i className="fas fa-layer-group mr-2 text-space-accent"></i> Combine Data Streams
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temperature Chart */}
        <div className="glass-panel p-6 rounded-2xl relative">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-2 h-2 rounded-full bg-space-rose mr-3 shadow-[0_0_10px_#f43f5e]"></div>
            Thermal Projection
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  tickLine={false}
                  axisLine={false}
                  unit="°C"
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0E17', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="temp" 
                  name="Avg Temp" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTemp)" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Chart */}
        <div className="glass-panel p-6 rounded-2xl relative">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-2 h-2 rounded-full bg-space-cyan mr-3 shadow-[0_0_10px_#22d3ee]"></div>
            Precipitation Volume
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  tickLine={false}
                  axisLine={false}
                  unit="mm"
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0E17', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="precip" 
                  name="Precipitation" 
                  fill="#22d3ee" 
                  barSize={24}
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