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
  TaxiRank,
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
  ranks: TaxiRank[];
  activeRankId: string | null;
  darkMode: boolean;
  soundEnabled: boolean;
  isLiveGps: boolean;
  gpsLoading: boolean;
  currentCityId: string;
  destinationTarget: LatLng | null;
  onRequestLiveGps: () => void;
  onSelectCity: (cityId: string) => void;
  onToggleSound: () => void;
  onSelectSurgeZone?: (zone: SurgeZone) => void;
  onSelectRank?: (rank: TaxiRank) => void;
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
  ranks,
  activeRankId,
  darkMode,
  soundEnabled,
  isLiveGps,
  gpsLoading,
  currentCityId,
  destinationTarget,
  onRequestLiveGps,
  onSelectCity,
  onToggleSound,
  onSelectSurgeZone,
  onSelectRank,
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
  const [tileSourceTier, setTileSourceTier] = useState<0 | 1 | 2>(0);
  const proxyUnavailableRef = useRef(false);

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

  // Update Tile Layer for Light / Night Map Theme (Server Proxy -> Direct CARTO CDN -> OSM fallback)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const effectiveTier: 0 | 1 | 2 =
      tileSourceTier === 0 && proxyUnavailableRef.current ? 1 : tileSourceTier;

    const rawViteKey = (import.meta.env.VITE_CARTO_API_KEY || '').trim();
    const keyQuery =
      rawViteKey && rawViteKey !== 'MY_CARTO_API_KEY'
        ? `?key=${encodeURIComponent(rawViteKey)}`
        : '';

    const style = darkMode ? 'dark_all' : 'voyager';
    const cartoDirectPath = darkMode ? 'dark_all' : 'rastertiles/voyager';

    let tileUrl = `/api/tiles/${style}/{z}/{x}/{y}{r}.png`;
    let options: L.TileLayerOptions = { maxZoom: 19 };

    if (effectiveTier === 1) {
      tileUrl = `https://{s}.basemaps.cartocdn.com/${cartoDirectPath}/{z}/{x}/{y}{r}.png${keyQuery}`;
      options = { maxZoom: 19, subdomains: 'abcd' };
    } else if (effectiveTier === 2) {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 19 };
    }

    let loadedAnyTile = false;
    let errorCount = 0;

    const layer = L.tileLayer(tileUrl, options);
    layer.on('tileload', () => {
      loadedAnyTile = true;
      errorCount = 0;
    });
    layer.on('tileerror', () => {
      errorCount += 1;
      if (!loadedAnyTile && errorCount >= 2 && effectiveTier < 2) {
        if (effectiveTier === 0) {
          proxyUnavailableRef.current = true;
        }
        setTileSourceTier((prev) => {
          const base = prev === 0 && proxyUnavailableRef.current ? 1 : prev;
          return base < 2 ? ((base + 1) as 0 | 1 | 2) : prev;
        });
      }
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [darkMode, tileSourceTier]);

  // Update Driver Vehicle Puck Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isOnline = status !== 'OFFLINE' && status !== 'ON_BREAK';
    const isBreak = status === 'ON_BREAK';
    const pulseHtml =
      status === 'ONLINE_IDLE'
        ? `<div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(52,209,134,0.28);animation:radar-pulse 2.2s cubic-bezier(0.16,1,0.3,1) infinite;"></div>`
        : '';

    const puckHtml = `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${pulseHtml}
        <div style="width:30px;height:30px;border-radius:9999px;background:#ffffff;border:2.5px solid #0f172a;box-shadow:0 4px 12px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;transform:rotate(${driverHeading}deg);transition:transform 120ms linear;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${
            isBreak ? '#F59E0B' : isOnline ? '#34D186' : '#64748B'
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

  // Render Surge Zones & Taxi Ranks when Offline, Online Idle, or On Break
  useEffect(() => {
    const group = surgeLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (status !== 'OFFLINE' && status !== 'ONLINE_IDLE' && status !== 'ON_BREAK') return;

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
        };color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:9999px;box-shadow:0 4px 10px rgba(0,0,0,0.25);white-space:nowrap;border:1.5px solid rgba(255,255,255,0.25);">⚡ ${zone.multiplier.toFixed(
          1
        )}x</div>`,
        iconSize: [54, 24],
        iconAnchor: [27, 12],
      });

      L.marker([zone.center.lat, zone.center.lng], { icon: badgeIcon })
        .on('click', () => onSelectSurgeZone?.(zone))
        .addTo(group);
    });

    // Taxi & Station Ranks
    ranks.forEach((rank) => {
      const joined = activeRankId === rank.id;
      const rankIcon = L.divIcon({
        className: '',
        html: `<div style="background:${
          joined ? '#25B670' : '#1E293B'
        };color:${joined ? '#0F172A' : '#FFFFFF'};font-size:10px;font-weight:800;padding:4px 9px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.28);white-space:nowrap;border:1.5px solid ${
          joined ? '#FFFFFF' : 'rgba(56,189,248,0.65)'
        };display:inline-flex;align-items:center;gap:4px;">
          <span style="background:${
            joined ? '#0F172A' : '#38BDF8'
          };color:${joined ? '#34D186' : '#0F172A'};padding:1px 4px;border-radius:4px;font-weight:900;">P</span>
          <span>${joined ? 'In Rank' : `Rank · ${rank.queueCount}`}</span>
        </div>`,
        iconSize: [86, 26],
        iconAnchor: [43, 13],
      });

      L.marker([rank.center.lat, rank.center.lng], { icon: rankIcon, zIndexOffset: 400 })
        .on('click', () => onSelectRank?.(rank))
        .addTo(group);
    });
  }, [surgeZones, ranks, activeRankId, status, onSelectSurgeZone, onSelectRank]);

  // Render Route Polylines, Pickup, Dropoff, and Destination Filter Pins
  useEffect(() => {
    const group = routeLayerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();

    if (
      destinationTarget &&
      (status === 'OFFLINE' || status === 'ONLINE_IDLE' || status === 'ON_BREAK')
    ) {
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:#0F172A;border:3px solid #34D186;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);"><div style="width:6px;height:6px;border-radius:9999px;background:#34D186;"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([destinationTarget.lat, destinationTarget.lng], { icon: destIcon }).addTo(group);
    }

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

      {/* Top Turn-by-Turn Navigation Banner (Sound Effects Mute/Unmute only, no voice) */}
      {showTurnBanner && (
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-2.5 right-[52px] sm:left-4 sm:right-auto sm:w-[400px] z-[400] pointer-events-auto">
          <div className="bg-[#111820] text-white rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-white/10 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#34D186] text-slate-950 flex items-center justify-center shrink-0">
              {currentManeuver?.direction === 'left' ? (
                <CornerUpLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              ) : currentManeuver?.direction === 'right' ? (
                <CornerUpRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              ) : (
                <Navigation className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg font-extrabold font-mono-num tracking-tight">
                  {distToManeuverMeters >= 1000
                    ? `${(distToManeuverMeters / 1000).toFixed(1)} km`
                    : `${distToManeuverMeters} m`}
                </span>
                <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold whitespace-nowrap">
                  {status === 'EN_ROUTE_PICKUP' ? 'To pickup' : 'To destination'}
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-slate-200 font-medium truncate">
                {currentManeuver?.instruction ||
                  (status === 'EN_ROUTE_PICKUP'
                    ? `Head toward ${activeRequest?.pickupAddress}`
                    : `Continue toward ${activeRequest?.dropoffAddress}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute navigation sounds' : 'Unmute navigation sounds'}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white shrink-0 transition-all"
              title={soundEnabled ? 'Navigation sounds on' : 'Navigation sounds muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Right Floating Map Controls — compact on phones, non-overlapping vertical rail */}
      <div
        className={`absolute right-2.5 sm:right-3 z-[420] flex flex-col gap-1.5 sm:gap-2 ${
          showTurnBanner
            ? 'top-[max(0.75rem,env(safe-area-inset-top))]'
            : 'top-[max(3.75rem,calc(env(safe-area-inset-top)+3rem))] lg:top-3.5'
        }`}
      >
        <button
          type="button"
          onClick={onOpenSafety}
          aria-label="Safety Toolkit"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-transform"
          title="Safety Toolkit"
        >
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onRequestLiveGps}
          aria-label="Use live GPS location"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center active:scale-95 transition-all ${
            isLiveGps
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title={gpsLoading ? 'Locating GPS...' : 'Use Live GPS Location'}
        >
          <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCityPicker((s) => !s)}
            aria-label="Switch world city"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-transform"
            title={`World Map City: ${currentCityName}`}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {showCityPicker && (
            <>
              <div
                className="fixed inset-0 z-[440]"
                onClick={() => setShowCityPicker(false)}
                aria-hidden="true"
              />
              <div className="absolute right-11 sm:right-13 top-0 w-44 sm:w-52 max-h-[42dvh] overflow-y-auto z-[450] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
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
                    className={`w-full min-h-[36px] sm:min-h-[42px] px-2.5 py-1.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
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
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map on vehicle"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all ${
            followDriver
              ? 'bg-[#34D186] text-slate-950 border-[#28B872]'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title="Recenter on Driver"
        >
          <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

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
