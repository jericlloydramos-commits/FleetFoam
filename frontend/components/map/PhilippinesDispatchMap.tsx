'use client';

import React, { useState } from 'react';
import { Job, Booking, Profile } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MapPin,
  Truck,
  Car,
  Navigation,
  Clock,
  Compass,
  Zap,
  Phone,
  Crosshair,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

import dynamic from 'next/dynamic';

// Dynamic import for Leaflet OpenStreetMap (avoids SSR window errors)
const FleetMap = dynamic(() => import('@/components/map/FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-950 rounded-3xl flex flex-col items-center justify-center text-white gap-3 border border-slate-800">
      <div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading OpenStreetMap Live Engine...</span>
    </div>
  ),
});

interface PhilippinesDispatchMapProps {
  jobs: Job[];
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
  onJobSelect?: (jobId: string) => void;
}

interface PHDistrict {
  id: string;
  name: string;
  city: string;
  x: number; // Percentage on SVG map canvas (0-100)
  y: number; // Percentage on SVG map canvas (0-100)
  activeVans: number;
}

const PH_DISTRICTS: PHDistrict[] = [
  { id: 'MINDANAO', name: 'Mindanao Regional Hub', city: 'Davao & CDO', x: 72, y: 78, activeVans: 4 },
  { id: 'QC_NORTH', name: 'Quezon City / North', city: 'Quezon City', x: 50, y: 18, activeVans: 3 },
  { id: 'ORTIGAS_PASIG', name: 'Ortigas Center', city: 'Pasig City', x: 65, y: 44, activeVans: 4 },
  { id: 'MAKATI_CBD', name: 'Makati CBD', city: 'Makati City', x: 38, y: 55, activeVans: 6 },
  { id: 'BGC_TAGUIG', name: 'Bonifacio Global City', city: 'Taguig City', x: 54, y: 62, activeVans: 5 },
  { id: 'ALABANG_SOUTH', name: 'Alabang / South Hub', city: 'Muntinlupa', x: 44, y: 88, activeVans: 2 },
];

export const PhilippinesDispatchMap: React.FC<PhilippinesDispatchMapProps> = ({
  jobs,
  selectedZone = 'ALL',
  onSelectZone,
  onJobSelect,
}) => {
  const [activePin, setActivePin] = useState<{
    type: 'JOB' | 'VAN';
    id: string;
    job?: Job;
  } | null>(null);

  const [engine, setEngine] = useState<'LEAFLET' | 'RADAR'>('LEAFLET');
  const [mapLayer, setMapLayer] = useState<'RADAR' | 'STREETS' | 'ZONES'>('STREETS');

  // Filter jobs based on selected PH zone
  const displayJobs = jobs.filter((j) => {
    if (selectedZone === 'ALL') return true;
    if (selectedZone === 'MINDANAO') {
      const loc = (j.booking?.service_location || '').toLowerCase();
      const city = (j.booking?.city || '').toLowerCase();
      return (
        (j.lat && j.lat < 10.0) ||
        loc.includes('davao') ||
        loc.includes('cdo') ||
        loc.includes('cagayan') ||
        loc.includes('gensan') ||
        loc.includes('zamboanga') ||
        loc.includes('mindanao') ||
        city.includes('mindanao') ||
        j.booking?.zone_ph?.includes('MINDANAO')
      );
    }
    if (selectedZone === 'BGC_TAGUIG') return j.booking?.zone_ph === 'BGC_TAGUIG' || j.booking?.city?.includes('Taguig');
    if (selectedZone === 'MAKATI_CBD') return j.booking?.zone_ph === 'MAKATI_CBD' || j.booking?.city?.includes('Makati');
    if (selectedZone === 'ORTIGAS_PASIG') return j.booking?.zone_ph === 'ORTIGAS_PASIG' || j.booking?.city?.includes('Pasig');
    if (selectedZone === 'QC_NORTH') return j.booking?.zone_ph === 'QC_NORTH' || j.booking?.city?.includes('Quezon');
    if (selectedZone === 'ALABANG_SOUTH') return j.booking?.zone_ph === 'ALABANG_SOUTH' || j.booking?.city?.includes('Muntinlupa');
    return true;
  });

  // Calculate pixel positions on the vector canvas
  const getJobCoordinates = (job: Job, index: number) => {
    const defaultPositions: Record<string, { x: number; y: number }> = {
      MINDANAO: { x: 72, y: 78 },
      BGC_TAGUIG: { x: 56, y: 64 },
      MAKATI_CBD: { x: 38, y: 53 },
      ORTIGAS_PASIG: { x: 67, y: 42 },
      QC_NORTH: { x: 52, y: 22 },
      ALABANG_SOUTH: { x: 45, y: 85 },
    };

    const zoneKey = job.booking?.zone_ph || (job.lat && job.lat < 10.0 ? 'MINDANAO' : 'BGC_TAGUIG');
    const base = defaultPositions[zoneKey] || { x: 50 + (index * 7) % 30, y: 40 + (index * 9) % 40 };

    const offsetX = ((index % 3) - 1) * 4;
    const offsetY = Math.floor(index / 2) * 3;

    return {
      x: Math.max(10, Math.min(90, base.x + offsetX)),
      y: Math.max(10, Math.min(90, base.y + offsetY)),
    };
  };

  return (
    <div className="stitch-card p-6 border border-slate-200/90 shadow-sm bg-white overflow-hidden space-y-5">
      {/* Map Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Philippines GPS Matrix
            </span>
            <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              MINDANAO &bull; NCR &bull; NATIONWIDE
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Philippines Fleet &amp; Live GPS Dispatch Map
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Real-time outdoor mobile crew tracking with browser live GPS across Metro Manila &amp; Mindanao (Davao, CDO, GenSan, Zamboanga).
          </p>
        </div>

        {/* Right side controls: Engine Toggle & Zone Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Map Engine Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setEngine('LEAFLET')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                engine === 'LEAFLET'
                  ? 'bg-sky-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🗺️ OpenStreetMap (Live)</span>
            </button>
            <button
              type="button"
              onClick={() => setEngine('RADAR')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                engine === 'RADAR'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📡 Radar View</span>
            </button>
          </div>

          {/* Zone Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap text-xs font-bold">
            {[
              { id: 'ALL', label: 'All PH' },
              { id: 'MINDANAO', label: '🏝️ Mindanao' },
              { id: 'BGC_TAGUIG', label: 'BGC' },
              { id: 'MAKATI_CBD', label: 'Makati' },
              { id: 'ORTIGAS_PASIG', label: 'Ortigas' },
              { id: 'QC_NORTH', label: 'QC' },
              { id: 'ALABANG_SOUTH', label: 'Alabang' },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => onSelectZone?.(z.id)}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedZone === z.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Engine View */}
      {engine === 'LEAFLET' ? (
        <FleetMap
          jobs={displayJobs}
          onSelectJob={onJobSelect}
          height="500px"
          showRoute={true}
        />
      ) : (
        /* Interactive Map Canvas Container */
        <div className="relative w-full h-[460px] sm:h-[500px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-inner select-none">
        {/* Subtle Tech Grid / Radar Overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Vector Metro Manila Arterial Roadways (EDSA, C5, Roxas Blvd, Skyway) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Manila Bay Coastline Outline */}
          <path
            d="M 5,0 Q 15,30 20,50 T 15,100"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />

          {/* Epifanio de los Santos Avenue (EDSA) */}
          <path
            d="M 55,5 C 50,30 35,50 30,75 L 35,95"
            fill="none"
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="2,2"
            strokeOpacity="0.6"
          />

          {/* Circumferential Road 5 (C5) */}
          <path
            d="M 68,10 C 66,35 60,60 52,85"
            fill="none"
            stroke="#334155"
            strokeWidth="1.0"
            strokeOpacity="0.5"
          />

          {/* Metro Manila Skyway Corridor */}
          <path
            d="M 38,40 L 42,70 L 46,95"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeDasharray="1,2"
            strokeOpacity="0.5"
          />

          {/* Live Dynamic Dispatch Vector Lines connecting Assigned Vans to Customers */}
          {displayJobs.map((job, idx) => {
            const coords = getJobCoordinates(job, idx);
            // Van is slightly offset from customer location
            const vanX = coords.x - 6;
            const vanY = coords.y - 4;

            if (job.status === 'ON_THE_WAY' || job.status === 'IN_PROGRESS') {
              return (
                <g key={`route-${job.id}`}>
                  <line
                    x1={vanX}
                    y1={vanY}
                    x2={coords.x}
                    y2={coords.y}
                    stroke={job.status === 'IN_PROGRESS' ? '#10b981' : '#38bdf8'}
                    strokeWidth="0.7"
                    strokeDasharray="1.5,1.5"
                    className="animate-pulse"
                  />
                </g>
              );
            }
            return null;
          })}
        </svg>

        {/* Metro Manila District Landmarks & Watermarks */}
        {PH_DISTRICTS.map((district) => (
          <div
            key={district.id}
            style={{ left: `${district.x}%`, top: `${district.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity ${
              selectedZone === 'ALL' || selectedZone === district.id ? 'opacity-80' : 'opacity-25'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-slate-700/80 border border-slate-600 mb-1" />
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase whitespace-nowrap drop-shadow-md">
                {district.name}
              </span>
              <span className="text-[9px] font-bold text-slate-600">{district.city}</span>
            </div>
          </div>
        ))}

        {/* Live Customer & Job Markers */}
        {displayJobs.map((job, idx) => {
          const coords = getJobCoordinates(job, idx);
          const isSelected = activePin?.id === job.id;
          const isLive = job.status === 'IN_PROGRESS' || job.status === 'ON_THE_WAY';

          return (
            <div
              key={job.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              {/* Pulsing ring for active wash jobs */}
              {isLive && (
                <span className="absolute -inset-2 rounded-full bg-sky-400 opacity-40 animate-ping pointer-events-none" />
              )}

              {/* Pin Marker Button */}
              <button
                type="button"
                onClick={() => {
                  setActivePin({ type: 'JOB', id: job.id, job });
                  onJobSelect?.(job.id);
                }}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-transform hover:scale-110 shadow-lg ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white ring-2 ring-sky-400 scale-110'
                    : job.status === 'IN_PROGRESS'
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : job.status === 'ON_THE_WAY'
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                <Car size={13} className="shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                    {job.booking?.vehicle_make} {job.booking?.vehicle_model}
                  </span>
                  <span className="text-[8px] font-mono opacity-80 mt-0.5">
                    {job.booking?.vehicle_plate}
                  </span>
                </div>
              </button>

              {/* Connected Crew Mobile Van Marker nearby */}
              {job.assignee && (
                <div
                  style={{ transform: 'translate(-28px, -24px)' }}
                  className="absolute pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={() => setActivePin({ type: 'VAN', id: job.id, job })}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[9px] shadow-md border border-amber-300 hover:scale-105 transition-transform"
                    title={`Assigned Crew: ${job.assignee.name}`}
                  >
                    <Truck size={10} />
                    <span>VAN {job.assignee.name.split(' ')[0]}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Selected Pin Details Interactive Popup */}
        {activePin?.job && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-2xl z-30 animate-in slide-in-from-bottom-2 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-slate-900 text-[13px]">
                  {activePin.job.booking?.vehicle_make} {activePin.job.booking?.vehicle_model}
                </span>
                <span className="font-mono text-[10px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded">
                  {activePin.job.booking?.vehicle_plate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePin(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                &times; Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Location (PH):
                </span>
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-rose-500 shrink-0" />
                  {activePin.job.booking?.service_location}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Status Pipeline:
                </span>
                <div className="mt-0.5">
                  <StatusBadge status={activePin.job.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Technician</span>
                <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                  {activePin.job.assignee?.name || 'Unassigned (Waiting for dispatch)'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Package Fee</span>
                <p className="font-black text-sky-700 text-xs mt-0.5">
                  ₱{activePin.job.booking?.service?.price?.toLocaleString() || '1,899'} PHP
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {activePin.job.booking?.time_slot}
              </span>
              <span className="font-bold text-emerald-600">
                ETA: ~{activePin.job.eta_minutes || 10} mins (via EDSA/C5)
              </span>
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-3 text-[10px] text-slate-300 font-semibold space-y-1.5 shadow-lg hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-200" />
            <span>Active Detailing Van (Field Crew)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-200" />
            <span>Wash In Progress (At Customer Site)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-200" />
            <span>On The Way (En Route)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500" />
            <span>Scheduled Appointment</span>
          </div>
        </div>

        {/* Live GPS Coordinates Watermark */}
        <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-500 hidden md:block">
          NCR COORDINATES: 14.5547° N, 121.0244° E &bull; DISPATCH SYNC: ACTIVE
        </div>
      </div>
    )}
  </div>
  );
};
