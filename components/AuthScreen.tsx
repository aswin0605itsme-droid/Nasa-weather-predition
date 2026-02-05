import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const user: User = {
        email,
        name: name || email.split('@')[0],
      };
      
      localStorage.setItem('weather_user', JSON.stringify(user));
      onLogin(user);
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[80vh] relative"
    >
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden border-t-2 border-t-white/20">
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg shadow-indigo-500/20">
              <i className="fas fa-meteor text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-indigo-400 text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isLogin ? 'Mission Control' : 'Initialize Access'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin 
                ? 'Authenticate to access climatic prediction models.' 
                : 'Request clearance for historical data archives.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="group">
                <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 ml-1">Identity</label>
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full bg-black/30 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-700 group-hover:border-slate-600"
                  placeholder="Commander Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="group">
              <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 ml-1">Comms ID</label>
              <input
                type="email"
                required
                className="w-full bg-black/30 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-700 group-hover:border-slate-600"
                placeholder="user@nasa.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 ml-1">Access Key</label>
              <input
                type="password"
                required
                className="w-full bg-black/30 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-700 group-hover:border-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:to-indigo-500 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center uppercase tracking-widest text-sm"
            >
              {loading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                isLogin ? 'Authenticate' : 'Request Access'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="hover:text-cyan-400 transition-colors font-medium border-b border-dashed border-gray-600 hover:border-cyan-400 pb-0.5"
            >
              {isLogin ? 'Request New Clearance' : 'Return to Login'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthScreen;