'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Job, JobStatus } from '@/lib/types';
import { MapPin, Navigation, Crosshair, Compass, Loader2 } from 'lucide-react';

interface FleetMapProps {
  jobs: Job[];
  selectedJobId?: string | null;
  onSelectJob?: (jobId: string) => void;
  height?: string;
  className?: string;
  showRoute?: boolean;
}

// Coordinate mapping for NCR and Mindanao regions based on location string
const LOCATION_COORDS: Record<string, [number, number]> = {
  // Metro Manila / NCR
  taguig: [14.5492, 121.048],
  bgc: [14.5492, 121.048],
  makati: [14.558, 121.021],
  pasig: [14.5866, 121.0617],
  ortigas: [14.5866, 121.0617],
  quezon: [14.6507, 121.0343],
  mandaluyong: [14.5794, 121.0359],
  alabang: [14.4216, 121.0425],
  muntinlupa: [14.4216, 121.0425],
  manila: [14.5839, 120.9794],

  // Mindanao Major Cities & Provinces
  davao: [7.1907, 125.4578],
  'cagayan de oro': [8.4542, 124.6319],
  cdo: [8.4542, 124.6319],
  zamboanga: [6.9214, 122.079],
  'general santos': [6.1164, 125.1716],
  gensan: [6.1164, 125.1716],
  iligan: [8.228, 124.2452],
  butuan: [8.9475, 125.5406],
  bukidnon: [8.1566, 125.1278],
  malaybalay: [8.1575, 125.1277],
  valencia: [7.9064, 125.0944],
  cotabato: [7.2236, 124.2462],
  tagum: [7.4479, 125.8078],
  koronadal: [6.5025, 124.8464],
  marawi: [8.0039, 124.2847],
  ozamiz: [8.1472, 123.8406],
  dipolog: [8.5878, 123.3406],
  surigao: [9.7894, 125.4958],
  mati: [6.9549, 126.2166],
  digos: [6.7586, 125.3564],
  panabo: [7.3061, 125.6833],
  samal: [7.0786, 125.7175],
  mindanao: [7.1907, 125.4578],
};

function resolveCoords(job: Job, index: number): [number, number] {
  if (job.lat && job.lng) {
    return [job.lat, job.lng];
  }
  const loc = (job.booking?.service_location || '').toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (loc.includes(key)) {
      // slight offset for uniqueness
      return [coords[0] + index * 0.003, coords[1] + index * 0.003];
    }
  }
  // Default NCR center offset
  return [14.5547 + (index % 3) * 0.015, 121.0244 + ((index + 1) % 3) * 0.015];
}

const STATUS_COLORS: Record<JobStatus, string> = {
  SCHEDULED: '#3b82f6',
  ON_THE_WAY: '#f59e0b',
  ARRIVED: '#6366f1',
  IN_PROGRESS: '#0284c7',
  AWAITING_APPROVAL: '#9333ea',
  NEEDS_REVISIT: '#e11d48',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  DELAYED: '#f97316',
};

export default function FleetMap({
  jobs,
  selectedJobId,
  onSelectJob,
  height = '460px',
  className = '',
  showRoute = true,
}: FleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; isMindanao: boolean } | null>(null);

  // Initialize Map with 100% Free OpenStreetMap Standard Tiles (No API key, No watermark)
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Center Metro Manila by default, can be zoomed/switched to Mindanao
      const map = L.map(mapContainerRef.current, {
        center: [14.5547, 121.04],
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean OpenStreetMap standard tile layer (100% Free, NO API Key needed, NO watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polylines whenever jobs or selectedJobId change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapInstanceRef.current) return;

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      if (jobs.length === 0) return;

      const bounds = L.latLngBounds([]);

      jobs.forEach((job, idx) => {
        const [lat, lng] = resolveCoords(job, idx);
        bounds.extend([lat, lng]);

        const isSelected = selectedJobId === job.id;
        const color = STATUS_COLORS[job.status] || '#0284c7';
        const isEnRoute = job.status === 'ON_THE_WAY' || job.status === 'IN_PROGRESS';

        // Custom HTML Marker Icon
        const iconHtml = `
          <div style="position: relative; cursor: pointer;">
            ${
              isEnRoute
                ? `<div style="position: absolute; width: 44px; height: 44px; top: -7px; left: -7px; border-radius: 9999px; background: ${color}; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 12px;
              background: ${isSelected ? '#0f172a' : 'white'};
              border: 2.5px solid ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.18);
              font-size: 14px;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: transform 0.2s ease;
            ">
              <span>🚐</span>
            </div>
            <div style="
              position: absolute;
              bottom: -18px;
              left: 50%;
              transform: translateX(-50%);
              background: #0f172a;
              color: white;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 6px;
              border-radius: 9999px;
              white-space: nowrap;
              border: 1px solid rgba(255,255,255,0.2);
            ">
              ${job.booking?.vehicle_make || 'Unit'}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'fleet-custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Popup Content
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b;">
                Dispatch #${job.id.substring(0, 6)}
              </span>
              <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: ${color}20; color: ${color}; border: 1px solid ${color}50;">
                ${job.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              ${job.booking?.vehicle_make || ''} ${job.booking?.vehicle_model || ''}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #0284c7; margin-bottom: 6px;">
              Plate: ${job.booking?.vehicle_plate || 'N/A'}
            </div>
            <div style="font-size: 11px; color: #475569; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              📍 ${job.booking?.service_location || 'Service Location'}
            </div>
            <div style="font-size: 10px; color: #64748b;">
              👤 Crew: <b>${job.assignee?.name || 'Field Unit'}</b>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectJob) {
            onSelectJob(job.id);
          }
        });

        if (isSelected) {
          marker.openPopup();
        }

        markersRef.current.push(marker);
      });

      // If selectedJob, draw route line
      if (showRoute && selectedJobId) {
        const selectedIndex = jobs.findIndex((j) => j.id === selectedJobId);
        if (selectedIndex !== -1) {
          const selectedJob = jobs[selectedIndex];
          const [destLat, destLng] = resolveCoords(selectedJob, selectedIndex);
          // Base coordinate (if Mindanao, base at Davao; if NCR, base at Taguig)
          const isDestMindanao = destLat < 10.0;
          const originCoords: [number, number] = isDestMindanao
            ? [7.0945, 125.612] // Davao Depot
            : [14.5378, 121.045]; // Taguig Depot

          const routePolyline = L.polyline([originCoords, [destLat, destLng]], {
            color: '#0284c7',
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.8,
          }).addTo(map);

          polylineRef.current = routePolyline;
        }
      }

      // Auto fit bounds only if user hasn't engaged manual live GPS
      if (bounds.isValid() && jobs.length > 0 && !userCoords) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [jobs, selectedJobId, mapLoaded, showRoute, onSelectJob, userCoords]);

  // ─── LIVE GPS GEOLOCATION (MINDANAO & NATIONWIDE) ───────────────────────────
  const handleGetLiveGPS = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const isMindanao = latitude < 10.0; // Philippines: Mindanao is between 5.5°N and 10°N

        setUserCoords({ lat: latitude, lng: longitude, isMindanao });

        const L = (await import('leaflet')).default;
        if (!mapInstanceRef.current) {
          setIsLocating(false);
          return;
        }

        const map = mapInstanceRef.current;

        // Clean previous user GPS marker
        if (userMarkerRef.current) userMarkerRef.current.remove();
        if (accuracyCircleRef.current) accuracyCircleRef.current.remove();

        // Pulsing GPS user radar marker
        const userIconHtml = `
          <div style="position: relative; cursor: pointer;">
            <div style="position: absolute; width: 46px; height: 46px; top: -9px; left: -9px; border-radius: 9999px; background: #0284c7; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 9999px;
              background: #0284c7;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(2,132,199,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
            ">
              📍
            </div>
            <div style="
              position: absolute;
              bottom: -22px;
              left: 50%;
              transform: translateX(-50%);
              background: #0f172a;
              color: #38bdf8;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 9999px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 1px solid rgba(56,189,248,0.4);
            ">
              ${isMindanao ? '📍 Your Mindanao Live GPS' : '📍 Your Live GPS'}
            </div>
          </div>
        `;

        const userIcon = L.divIcon({
          html: userIconHtml,
          className: 'user-live-gps-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -18],
        });

        // Accuracy radar circle
        const circle = L.circle([latitude, longitude], {
          radius: Math.max(accuracy, 120),
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);

        const marker = L.marker([latitude, longitude], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 900; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 6px;">
                ${isMindanao ? 'MINDANAO NODE' : 'PHILIPPINES GPS'}
              </span>
              <span style="font-size: 10px; color: #10b981; font-weight: 800;">● LIVE GPS ACTIVE</span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
              Your Device Live Location
            </div>
            <div style="font-size: 11px; font-mono: monospace; color: #334155; margin-bottom: 4px;">
              Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}
            </div>
            <div style="font-size: 10px; color: #64748b;">
              Accuracy: ±${Math.round(accuracy)} meters
            </div>
          </div>
        `);

        userMarkerRef.current = marker;
        accuracyCircleRef.current = circle;

        // Smooth fly to exact user position
        map.flyTo([latitude, longitude], 15, { duration: 1.5 });
        marker.openPopup();
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Live GPS error:', err);
        // If hardware GPS permission denied or unavailable on desktop, fly directly to Mindanao Hub (Davao)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([7.1907, 125.4578], 12, { duration: 1.5 });
        }
        alert('Could not acquire hardware GPS (' + err.message + '). Centered to Mindanao (Davao Hub) automatically!');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Fly to Mindanao Regional Hub (Davao / CDO)
  const handleFlyToMindanao = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([7.1907, 125.4578], 11, { duration: 1.4 });
  };

  // Fly to NCR / Metro Manila Hub
  const handleFlyToManila = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([14.5547, 121.04], 12, { duration: 1.4 });
  };

  // Recenter Map over all active job units
  const handleRecenter = async () => {
    if (!mapInstanceRef.current || jobs.length === 0) return;
    const L = (await import('leaflet')).default;
    const bounds = L.latLngBounds([]);
    jobs.forEach((job, idx) => bounds.extend(resolveCoords(job, idx)));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>OpenStreetMap Live Dispatch</span>
          <span className="text-[10px] text-slate-400 font-normal">| {jobs.length} Active Units</span>
        </div>

        {/* Live GPS Active Pill */}
        {userCoords && (
          <div className="bg-sky-600 text-white px-2.5 py-1 rounded-xl shadow-md text-xs font-black flex items-center gap-1.5 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{userCoords.isMindanao ? '📍 Mindanao Live GPS Active' : '📍 Live GPS Tracking'}</span>
          </div>
        )}
      </div>

      {/* Action Controls Overlay (Live GPS, Mindanao, NCR, Recenter) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center justify-end gap-1.5">
        {/* Live GPS Button */}
        <button
          type="button"
          onClick={handleGetLiveGPS}
          disabled={isLocating}
          className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white px-3 py-2 rounded-xl shadow-md font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-sky-400/30"
          title="Track your current live device GPS (Mindanao & Nationwide)"
        >
          {isLocating ? (
            <Loader2 size={15} className="animate-spin text-white" />
          ) : (
            <Crosshair size={15} className="text-white animate-pulse" />
          )}
          <span>{isLocating ? 'Acquiring GPS...' : '📍 My Live GPS'}</span>
        </button>

        {/* Quick Fly to Mindanao */}
        <button
          type="button"
          onClick={handleFlyToMindanao}
          className="bg-white/95 hover:bg-white text-slate-800 hover:text-sky-700 px-2.5 py-2 rounded-xl border border-slate-200/80 shadow-md text-xs font-bold transition-all cursor-pointer"
          title="Focus on Mindanao Region (Davao, CDO, GenSan)"
        >
          🏝️ Mindanao
        </button>

        {/* Quick Fly to Metro Manila */}
        <button
          type="button"
          onClick={handleFlyToManila}
          className="bg-white/95 hover:bg-white text-slate-800 hover:text-sky-700 px-2.5 py-2 rounded-xl border border-slate-200/80 shadow-md text-xs font-bold transition-all cursor-pointer"
          title="Focus on Metro Manila / NCR"
        >
          🏙️ NCR
        </button>

        {/* Recenter Map over all jobs */}
        <button
          type="button"
          onClick={handleRecenter}
          className="bg-white/95 hover:bg-white p-2 rounded-xl border border-slate-200/80 shadow-md text-slate-700 hover:text-sky-600 transition-all cursor-pointer"
          title="Recenter Map across all units"
          aria-label="Recenter Map"
        >
          <Navigation size={16} />
        </button>
      </div>

      {/* Leaflet Map DOM Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="bg-slate-100 z-0"
      />
    </div>
  );
}
