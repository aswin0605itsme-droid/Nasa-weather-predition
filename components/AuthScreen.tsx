import React, { useState } from 'react';
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
    
    // Simulate API call
    setTimeout(() => {
      const user: User = {
        email,
        name: name || email.split('@')[0],
      };
      
      // Persist simulation
      localStorage.setItem('weather_user', JSON.stringify(user));
      onLogin(user);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-space-800 border border-space-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-space-accent/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-space-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-space-700 shadow-inner">
              <i className="fas fa-meteor text-space-accent text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Mission'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin 
                ? 'Access your personalized weather intelligence dashboard.' 
                : 'Start analyzing climatological data today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">FULL NAME</label>
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full bg-space-900 border border-space-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-space-accent focus:border-transparent outline-none transition-all placeholder-gray-600"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                className="w-full bg-space-900 border border-space-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-space-accent focus:border-transparent outline-none transition-all placeholder-gray-600"
                placeholder="astronaut@nasa.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">PASSWORD</label>
              <input
                type="password"
                required
                className="w-full bg-space-900 border border-space-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-space-accent focus:border-transparent outline-none transition-all placeholder-gray-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-space-accent to-white text-space-900 font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-space-accent/20 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                isLogin ? 'Launch Dashboard' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-space-accent hover:text-white underline font-medium"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;