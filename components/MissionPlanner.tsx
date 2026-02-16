import React, { useState, useMemo } from 'react';
import { Plane, Hammer, Leaf, AlertTriangle, CheckCircle, XCircle, Wind, Droplets } from 'lucide-react';

interface MissionPlannerProps {
  currentTemp: number;
  windSpeed: number; // km/h
  precip: number; // mm
  humidity: number; // %
}

type ProfileType = 'drone' | 'concrete' | 'agri';

const MissionPlanner: React.FC<MissionPlannerProps> = ({ currentTemp, windSpeed, precip, humidity }) => {
  const [profile, setProfile] = useState<ProfileType>('drone');

  // Rule-Based Decision Support System (DSS)
  const status = useMemo(() => {
    let passed = true;
    let reason = "Conditions Nominal";

    switch (profile) {
      case 'drone':
        // Drone: Max Wind 20km/h, No Rain
        if (windSpeed > 20) {
          passed = false;
          reason = `Wind shear critical (${windSpeed} km/h > 20 km/h)`;
        } else if (precip > 0.5) {
          passed = false;
          reason = "Precipitation detects sensor risk";
        }
        break;

      case 'concrete':
        // Concrete: Temp 10-32°C, Max Humidity 85%
        if (currentTemp < 10 || currentTemp > 32) {
          passed = false;
          reason = `Thermal limit breach (${currentTemp.toFixed(1)}°C outside 10-32°C)`;
        } else if (humidity > 85) {
          passed = false;
          reason = `Moisture saturation high (${humidity}%)`;
        }
        break;

      case 'agri':
        // Agri: Max Wind 15km/h, Temp 15-28°C
        if (windSpeed > 15) {
          passed = false;
          reason = `Spray drift risk (Wind > 15 km/h)`;
        } else if (currentTemp < 15 || currentTemp > 28) {
          passed = false;
          reason = `Ineffective uptake temp (${currentTemp.toFixed(1)}°C)`;
        }
        break;
    }

    return { passed, reason };
  }, [profile, currentTemp, windSpeed, precip, humidity]);

  const getIcon = () => {
    switch(profile) {
      case 'drone': return <Plane size={18} />;
      case 'concrete': return <Hammer size={18} />;
      case 'agri': return <Leaf size={18} />;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tactical Planner</h3>
            <p className="text-[10px] text-slate-400 font-mono">DSS v2.4</p>
          </div>
        </div>
        
        {/* Profile Selector */}
        <select 
          value={profile} 
          onChange={(e) => setProfile(e.target.value as ProfileType)}
          className="bg-slate-950/50 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-cyan-400"
        >
          <option value="drone">Drone Flight</option>
          <option value="concrete">Concrete Pour</option>
          <option value="agri">Agri-Spray</option>
        </select>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center z-10">
        <div className={`
          relative w-24 h-24 rounded-full flex items-center justify-center border-4 
          transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.3)]
          ${status.passed ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/50 bg-rose-500/10'}
        `}>
          {status.passed 
            ? <CheckCircle size={40} className="text-emerald-400" />
            : <XCircle size={40} className="text-rose-400" />
          }
          <div className={`absolute -bottom-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status.passed ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
            {status.passed ? 'GO' : 'NO-GO'}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className={`text-xs font-mono mb-2 ${status.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
            {status.passed ? "All parameters within safety thresholds." : status.reason}
          </p>
          
          {/* Mini Data readout */}
          <div className="flex justify-center gap-4 mt-4 border-t border-white/5 pt-4">
             <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Temp</div>
                <div className={`text-xs font-bold ${!status.passed && status.reason.includes('Temp') ? 'text-rose-400' : 'text-slate-300'}`}>
                    {currentTemp.toFixed(1)}°C
                </div>
             </div>
             <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Wind</div>
                <div className={`text-xs font-bold ${!status.passed && (status.reason.includes('Wind') || status.reason.includes('drift')) ? 'text-rose-400' : 'text-slate-300'}`}>
                    {windSpeed}kph
                </div>
             </div>
             <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Hum</div>
                <div className={`text-xs font-bold ${!status.passed && (status.reason.includes('saturation') || status.reason.includes('Rain')) ? 'text-rose-400' : 'text-slate-300'}`}>
                    {humidity}%
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Decorative BG */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default MissionPlanner;