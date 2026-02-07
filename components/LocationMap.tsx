import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, Activity, Crosshair, MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ lat, lon, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            onLocationSelect(parseFloat(lat), parseFloat(lon));
            setSearchQuery('');
        } else {
            alert("Sector not found. Refine coordinates.");
        }
    } catch (error) {
        console.error("Map search failed:", error);
    } finally {
        setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 10,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Matter tiles for space theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(mapInstanceRef.current);

      // Custom icon
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #22d3ee; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 15px #22d3ee;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      markerRef.current = L.marker([lat, lon], { icon }).addTo(mapInstanceRef.current);

      // Add click handler
      mapInstanceRef.current.on('click', (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
      
      // Add simple zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Cleanup handled by ref persistence in React 18+ strict mode often tricky with Leaflet
      // We check if map container still exists before removing to avoid errors
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); 

  // Update view when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
      
      // Force resize calculation for mobile tab switching scenarios
      mapInstanceRef.current.invalidateSize();
    }
  }, [lat, lon]);

  return (
    <div className="relative w-full h-full isolate">
      {/* The Map */}
      <div ref={mapRef} className="w-full h-full rounded-xl z-0 outline-none" style={{ background: '#0B0E17' }} />
      
      {/* Search Bar Overlay */}
      <div className="absolute top-4 right-4 z-[400] w-[calc(100%-2rem)] sm:w-auto sm:max-w-xs">
        <form onSubmit={handleSearch} className="relative group/search">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={12} className="text-cyan-400/70" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan sector..."
                className="w-full bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-full py-2 pl-9 pr-10 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all shadow-lg placeholder-slate-500 hover:bg-slate-900/90"
            />
            <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/10 rounded-full text-slate-400 hover:text-white hover:bg-cyan-500/20 transition-all"
                disabled={isSearching}
            >
                {isSearching ? <Activity size={12} className="animate-spin" /> : <Search size={12} />}
            </button>
        </form>
      </div>

      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-[400] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
          <span className="text-[10px] font-mono text-slate-300 tracking-wider">LIVE TRACKING</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-4 sm:bottom-4 sm:right-4 sm:left-auto z-[400] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-left sm:text-right pointer-events-none">
         <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Coordinates</div>
         <div className="text-xs font-mono text-cyan-400 flex items-center gap-2">
            <Navigation size={10} className="transform rotate-45" />
            {lat.toFixed(4)}, {lon.toFixed(4)}
         </div>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-xl pointer-events-none z-10"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-xl pointer-events-none z-10"></div>
    </div>
  );
};

export default LocationMap;