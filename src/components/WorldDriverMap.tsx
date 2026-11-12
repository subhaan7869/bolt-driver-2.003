import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Globe,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WORLD_CITIES, haversineKm } from '../data/worldMapData';
import {
  DriverStatus,
  LatLng,
  ManeuverStep,
  RideRequest,
  SurgeZone,
} from '../types/driver';

interface WorldDriverMapProps {
  driverPos: LatLng;
  driverHeading: number;
  status: DriverStatus;
  activeRequest: RideRequest | null;
  activeRoute: LatLng[];
  previewDropoffRoute: LatLng[];
  currentManeuver: ManeuverStep | null;
  surgeZones: SurgeZone[];
  darkMode: boolean;
  voiceEnabled: boolean;
  isLiveGps: boolean;
  gpsLoading: boolean;
  currentCityId: string;
  destinationTarget: LatLng | null;
  onRequestLiveGps: () => void;
  onSelectCity: (cityId: string) => void;
  onToggleVoice: () => void;
  onSelectSurgeZone?: (zone: SurgeZone) => void;
  onOpenSafety: () => void;
}

export const WorldDriverMap: React.FC<WorldDriverMapProps> = ({
  driverPos,
  driverHeading,
  status,
  activeRequest,
  activeRoute,
  previewDropoffRoute,
  currentManeuver,
  surgeZones,
  darkMode,
  voiceEnabled,
  isLiveGps,
  gpsLoading,
  currentCityId,
  destinationTarget,
  onRequestLiveGps,
  onSelectCity,
  onToggleVoice,
  onSelectSurgeZone,
  onOpenSafety,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const surgeLayerRef = useRef<L.LayerGroup | null>(null);
  const [followDriver, setFollowDriver] = useState(true);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Initialize Leaflet World Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [driverPos.lat, driverPos.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    const layerGroup = L.layerGroup().addTo(map);
    const surgeGroup = L.layerGroup().addTo(map);

    map.on('dragstart', () => {
      setFollowDriver(false);
    });

    mapRef.current = map;
    routeLayerRef.current = layerGroup;
    surgeLayerRef.current = surgeGroup;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer for Light / Night Map Theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = darkMode
      ? '/api/tiles/dark_all/{z}/{x}/{y}{r}.png'
      : '/api/tiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);
  }, [darkMode]);

  // Update Driver Vehicle Puck Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isOnline = status !== 'OFFLINE';
    const pulseHtml =
      status === 'ONLINE_IDLE'
        ? `<div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(52,209,134,0.28);animation:radar-pulse 2.2s cubic-bezier(0.16,1,0.3,1) infinite;"></div>`
        : '';

    const puckHtml = `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${pulseHtml}
        <div style="width:30px;height:30px;border-radius:9999px;background:#ffffff;border:2.5px solid #0f172a;box-shadow:0 4px 12px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;transform:rotate(${driverHeading}deg);transition:transform 120ms linear;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${
            isOnline ? '#34D186' : '#64748B'
          }">
            <polygon points="12,2 20,20 12,15 4,20" />
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: '',
      html: puckHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
      driverMarkerRef.current.setIcon(icon);
    }

    if (followDriver) {
      map.panTo([driverPos.lat, driverPos.lng], { animate: true, duration: 0.35 });
    }
  }, [driverPos.lat, driverPos.lng, driverHeading, status, followDriver]);

  // Render Surge Zones when Offline or Online Idle
  useEffect(() => {
    const group = surgeLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (status !== 'OFFLINE' && status !== 'ONLINE_IDLE') return;

    surgeZones.forEach((zone) => {
      const color = zone.demandLevel === 'Peak' ? '#F97316' : '#34D186';
      L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color,
        weight: 1.5,
        opacity: 0.45,
        fillColor: color,
        fillOpacity: 0.18,
      })
        .on('click', () => onSelectSurgeZone?.(zone))
        .addTo(group);

      const badgeIcon = L.divIcon({
        className: '',
        html: `<div style="background:${
          zone.demandLevel === 'Peak' ? '#EA580C' : '#0F172A'
        };color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:9999px;box-shadow:0 4px 10px rgba(0,0,0,0.25);white-space:nowrap;border:1.5px solid rgba(255,255,255,0.25);">${zone.multiplier.toFixed(
          1
        )}x</div>`,
        iconSize: [46, 24],
        iconAnchor: [23, 12],
      });

      L.marker([zone.center.lat, zone.center.lng], { icon: badgeIcon })
        .on('click', () => onSelectSurgeZone?.(zone))
        .addTo(group);
    });
  }, [surgeZones, status, onSelectSurgeZone]);

  // Render Route Polylines, Pickup, Dropoff, and Destination Filter Pins
  useEffect(() => {
    const group = routeLayerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();

    // Destination filter marker
    if (destinationTarget && (status === 'OFFLINE' || status === 'ONLINE_IDLE')) {
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:#0F172A;border:3px solid #34D186;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);"><div style="width:6px;height:6px;border-radius:9999px;background:#34D186;"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([destinationTarget.lat, destinationTarget.lng], { icon: destIcon }).addTo(group);
    }

    // Preview Trip Route during Incoming Request
    if (status === 'INCOMING_REQUEST' && previewDropoffRoute.length > 1) {
      L.polyline(
        previewDropoffRoute.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: darkMode ? '#94A3B8' : '#334155',
          weight: 4.5,
          dashArray: '8 8',
          opacity: 0.85,
        }
      ).addTo(group);
    }

    // Active Bolt Green Route
    if (
      (status === 'INCOMING_REQUEST' ||
        status === 'EN_ROUTE_PICKUP' ||
        status === 'ARRIVED_PICKUP' ||
        status === 'IN_PROGRESS') &&
      activeRoute.length > 1
    ) {
      const latlngs = activeRoute.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(latlngs, {
        color: '#15803D',
        weight: 8,
        opacity: 0.3,
      }).addTo(group);
      L.polyline(latlngs, {
        color: '#34D186',
        weight: 5,
        opacity: 0.96,
      }).addTo(group);
    }

    // Pickup Pin
    if (
      activeRequest &&
      (status === 'INCOMING_REQUEST' ||
        status === 'EN_ROUTE_PICKUP' ||
        status === 'ARRIVED_PICKUP')
    ) {
      const pickupIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);">
            <div style="background:#0F172A;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;white-space:nowrap;margin-bottom:4px;box-shadow:0 4px 10px rgba(0,0,0,0.28);">
              Pickup · ${activeRequest.pickupArea}
            </div>
            <div style="width:22px;height:22px;border-radius:9999px;background:#34D186;border:3.5px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <div style="width:7px;height:7px;border-radius:9999px;background:#0F172A;"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([activeRequest.pickupCoords.lat, activeRequest.pickupCoords.lng], {
        icon: pickupIcon,
      }).addTo(group);
    }

    // Dropoff Pin
    if (activeRequest && (status === 'INCOMING_REQUEST' || status === 'IN_PROGRESS')) {
      const dropIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);">
            <div style="background:#0F172A;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;white-space:nowrap;margin-bottom:4px;box-shadow:0 4px 10px rgba(0,0,0,0.28);">
              Dropoff · ${activeRequest.dropoffArea}
            </div>
            <div style="width:20px;height:20px;border-radius:5px;background:#0F172A;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <div style="width:7px;height:7px;border-radius:2px;background:#34D186;"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([activeRequest.dropoffCoords.lat, activeRequest.dropoffCoords.lng], {
        icon: dropIcon,
      }).addTo(group);
    }

    // Fit bounds nicely when previewing an incoming request
    if (status === 'INCOMING_REQUEST' && activeRequest) {
      const bounds = L.latLngBounds([
        [driverPos.lat, driverPos.lng],
        [activeRequest.pickupCoords.lat, activeRequest.pickupCoords.lng],
        [activeRequest.dropoffCoords.lat, activeRequest.dropoffCoords.lng],
      ]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15, animate: true });
      setFollowDriver(false);
    }
  }, [
    status,
    activeRequest,
    activeRoute,
    previewDropoffRoute,
    destinationTarget,
    darkMode,
    driverPos.lat,
    driverPos.lng,
  ]);

  const handleRecenter = () => {
    setFollowDriver(true);
    mapRef.current?.setView([driverPos.lat, driverPos.lng], 15, { animate: true });
  };

  const showTurnBanner = status === 'EN_ROUTE_PICKUP' || status === 'IN_PROGRESS';
  const remainingTarget =
    status === 'EN_ROUTE_PICKUP' ? activeRequest?.pickupCoords : activeRequest?.dropoffCoords;
  const distToManeuverMeters =
    currentManeuver?.distanceMeters ||
    (remainingTarget ? Math.max(50, Math.round(haversineKm(driverPos, remainingTarget) * 1000)) : 180);

  const currentCityName =
    WORLD_CITIES.find((c) => c.id === currentCityId)?.name || 'London';

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        darkMode ? 'bg-[#14181F]' : 'bg-[#EEF1F4]'
      }`}
    >
      {/* Leaflet World Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Turn-by-Turn Navigation Banner with Live Voice Mute Button */}
      {showTurnBanner && (
        <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[410px] z-[400] pointer-events-auto">
          <div className="bg-[#111820] text-white rounded-2xl p-3.5 shadow-xl border border-white/10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#34D186] text-slate-950 flex items-center justify-center shrink-0">
              {currentManeuver?.direction === 'left' ? (
                <CornerUpLeft className="w-7 h-7 stroke-[2.5]" />
              ) : currentManeuver?.direction === 'right' ? (
                <CornerUpRight className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <Navigation className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold font-mono-num tracking-tight">
                  {distToManeuverMeters >= 1000
                    ? `${(distToManeuverMeters / 1000).toFixed(1)} km`
                    : `${distToManeuverMeters} m`}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {status === 'EN_ROUTE_PICKUP' ? 'To pickup' : 'To destination'}
                </span>
              </div>
              <p className="text-sm text-slate-200 font-medium truncate">
                {currentManeuver?.instruction ||
                  (status === 'EN_ROUTE_PICKUP'
                    ? `Head toward ${activeRequest?.pickupAddress}`
                    : `Continue toward ${activeRequest?.dropoffAddress}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleVoice}
              aria-label={voiceEnabled ? 'Mute voice navigation' : 'Unmute voice navigation'}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors"
              title={voiceEnabled ? 'Voice guidance on' : 'Voice guidance muted'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Right Floating Map Controls: Live GPS, World City Switcher, Safety, Recenter, Zoom */}
      <div className="absolute right-3.5 top-20 sm:top-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenSafety}
          aria-label="Safety Toolkit"
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-transform"
          title="Safety Toolkit"
        >
          <ShieldAlert className="w-5 h-5" />
        </button>

        {/* Real Browser Live GPS Button */}
        <button
          type="button"
          onClick={onRequestLiveGps}
          aria-label="Use live GPS location"
          className={`w-11 h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all ${
            isLiveGps
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title={gpsLoading ? 'Locating GPS...' : 'Use Live GPS Location'}
        >
          <LocateFixed className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* World City Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCityPicker((s) => !s)}
            aria-label="Switch world city"
            className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform"
            title={`World Map City: ${currentCityName}`}
          >
            <Globe className="w-5 h-5" />
          </button>

          {showCityPicker && (
            <div className="absolute right-13 top-0 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                World Cities
              </div>
              {WORLD_CITIES.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city.id);
                    setFollowDriver(true);
                    setShowCityPicker(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                    !isLiveGps && currentCityId === city.id
                      ? 'bg-[#34D186]/15 text-slate-950 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{city.name}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{city.currency.trim()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recenter on Vehicle */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map on vehicle"
          className={`w-11 h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all ${
            followDriver
              ? 'bg-[#34D186] text-slate-950 border-[#28B872]'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title="Recenter on Driver"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Zoom Controls */}
        <div className="hidden sm:flex flex-col rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-11 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-200/70 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-11 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
