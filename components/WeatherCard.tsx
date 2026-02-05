import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface WeatherCardProps {
  title?: string;
  value?: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  delay?: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  children, 
  className = "",
  trend,
  trendValue,
  onClick,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] ${className}`}
      onClick={onClick}
    >
      {/* Glossy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 p-6 h-full flex flex-col">
        {(title || Icon) && (
          <div className="flex justify-between items-start mb-4">
            {title && (
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">
                {title}
              </h3>
            )}
            {Icon && (
              <div className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 text-slate-300 group-hover:text-cyan-400 transition-colors">
                <Icon size={16} />
              </div>
            )}
          </div>
        )}

        <div className="flex-grow">
          {value && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
              {trend && trendValue && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
                  trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'} {trendValue}
                </span>
              )}
            </div>
          )}
          
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherCard;