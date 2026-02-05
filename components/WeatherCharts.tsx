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
      <div className="bg-space-800 p-6 rounded-xl border border-space-700 shadow-lg mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <i className="fas fa-chart-line text-purple-400 mr-2"></i>
            Integrated Weather Model
          </h3>
          <button 
            onClick={() => setCombinedView(false)}
            className="text-xs bg-space-700 hover:bg-space-600 px-3 py-1 rounded text-gray-300 transition-colors"
          >
            Split View
          </button>
        </div>
        <div className="h-[400px] w-full min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorTempCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#a0aec0" 
                tick={{fill: '#a0aec0', fontSize: 12}} 
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#ef4444" 
                tick={{fill: '#ef4444', fontSize: 12}} 
                tickLine={false}
                unit="°C"
                label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#ef4444' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#60a5fa" 
                tick={{fill: '#60a5fa', fontSize: 12}} 
                tickLine={false}
                unit="mm"
                label={{ value: 'Precip (mm)', angle: 90, position: 'insideRight', fill: '#60a5fa' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="temp" 
                name="Temperature" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorTempCombined)" 
              />
              <Bar 
                yAxisId="right"
                dataKey="precip" 
                name="Precipitation" 
                fill="#60a5fa" 
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setCombinedView(true)}
          className="text-xs flex items-center bg-space-700 hover:bg-space-600 px-3 py-1.5 rounded text-white transition-colors shadow-lg border border-space-600"
        >
          <i className="fas fa-layer-group mr-2"></i> Combine Charts
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="bg-space-800 p-6 rounded-xl border border-space-700 shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <i className="fas fa-temperature-high text-red-400 mr-2"></i>
            Historical Temperature
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#a0aec0" 
                  tick={{fill: '#a0aec0', fontSize: 12}} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#a0aec0" 
                  tick={{fill: '#a0aec0', fontSize: 12}} 
                  tickLine={false}
                  unit="°C"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="temp" 
                  name="Avg Temp Range" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorTemp)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#fca5a5" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Chart */}
        <div className="bg-space-800 p-6 rounded-xl border border-space-700 shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <i className="fas fa-cloud-rain text-blue-400 mr-2"></i>
            Historical Precipitation
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#a0aec0" 
                  tick={{fill: '#a0aec0', fontSize: 12}} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#a0aec0" 
                  tick={{fill: '#a0aec0', fontSize: 12}} 
                  tickLine={false}
                  unit="mm"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar 
                  dataKey="precip" 
                  name="Avg Precipitation" 
                  fill="#60a5fa" 
                  barSize={30}
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