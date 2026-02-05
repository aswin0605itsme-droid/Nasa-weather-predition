import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LocationMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ lat, lon, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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
        html: `<div style="background-color: #d0d6f9; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px #d0d6f9;"></div>`,
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
      // Cleanup handled by ref persistence, full cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Run once on mount to setup

  // Update view when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
    }
  }, [lat, lon]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl z-0" />
      <div className="absolute top-4 left-4 z-[400] bg-space-900/80 backdrop-blur px-3 py-1 rounded border border-space-700 text-xs text-gray-300">
        <i className="fas fa-crosshairs mr-2 text-space-accent"></i>
        Click to scan sector
      </div>
    </div>
  );
};

export default LocationMap;