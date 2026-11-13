import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  BatteryCharging,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Flame,
  Fuel,
  Gauge,
  Globe,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  RotateCw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WORLD_CITIES, exactDistanceKm } from '../data/worldMapData';
import {
  DistrictDemandZone,
  DriverStatus,
  LatLng,
  ManeuverStep,
  RideRequest,
  SurgeZone,
  TaxiRank,
  Vehicle,
} from '../types/driver';
import { D3DemandHeatmap } from './D3DemandHeatmap';

interface WorldDriverMapProps {
  driverPos: LatLng;
  driverHeading: number;
  status: DriverStatus;
  activeRequest: RideRequest | null;
  activeRoute: LatLng[];
  previewDropoffRoute: LatLng[];
  currentRouteIndex: number;
  currentManeuver: ManeuverStep | null;
  nextManeuver: ManeuverStep | null;
  navSpeedKmh: number;
  remainingEtaMin: number;
  remainingDistKm: number;
  surgeZones: SurgeZone[];
  districtDemandZones: DistrictDemandZone[];
  showHeatmap: boolean;
  headingUpNav: boolean;
  ranks: TaxiRank[];
  activeRankId: string | null;
  rankQueuePos: number | null;
  activeVehicle: Vehicle;
  darkMode: boolean;
  soundEnabled: boolean;
  isLiveGps: boolean;
  gpsLoading: boolean;
  isRerouting?: boolean;
  currentCityId: string;
  destinationTarget: LatLng | null;
  onToggleLiveGps: () => void;
  onToggleHeatmap: () => void;
  onToggleHeadingUp: () => void;
  onRefuelOrCharge: () => void;
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
  currentRouteIndex,
  currentManeuver,
  nextManeuver,
  navSpeedKmh,
  remainingEtaMin,
  remainingDistKm,
  surgeZones,
  districtDemandZones,
  showHeatmap,
  headingUpNav,
  ranks,
  activeRankId,
  rankQueuePos,
  activeVehicle,
  darkMode,
  soundEnabled,
  isLiveGps,
  gpsLoading,
  isRerouting,
  currentCityId,
  destinationTarget,
  onToggleLiveGps,
  onToggleHeatmap,
  onToggleHeadingUp,
  onRefuelOrCharge,
  onSelectCity,
  onToggleSound,
  onSelectSurgeZone,
  onSelectRank,
  onOpenSafety,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const surgeLayerRef = useRef<L.LayerGroup | null>(null);
  const fittedRequestIdRef = useRef<string | null>(null);
  const prevNavPhaseRef = useRef<DriverStatus>('OFFLINE');

  const [followDriver, setFollowDriver] = useState(true);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [tileSourceTier, setTileSourceTier] = useState<0 | 1 | 2>(0);
  const [serverCartoConfigured, setServerCartoConfigured] = useState<boolean>(false);

  const rawViteKey = (import.meta.env.VITE_CARTO_API_KEY || '').trim();
  const hasViteCartoKey = Boolean(rawViteKey && rawViteKey !== 'MY_CARTO_API_KEY');

  useEffect(() => {
    if (hasViteCartoKey) return;
    fetch('/api/tiles?mode=info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.cartoConfigured === true) {
          setServerCartoConfigured(true);
          setTileSourceTier(0);
        }
      })
      .catch(() => {});
  }, [hasViteCartoKey]);

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
    setMapInstance(map);
    routeLayerRef.current = layerGroup;
    surgeLayerRef.current = surgeGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, []);

  const hasCartoKey = hasViteCartoKey || serverCartoConfigured;
  const usingTrueDarkCarto = hasCartoKey && tileSourceTier === 0;

  // Update Tile Layer: Zero-key ArcGIS World Street Map -> OpenStreetMap -> /api/tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const style = darkMode ? 'dark_all' : 'voyager';
    let tileUrl = '';
    const options: L.TileLayerOptions = { maxZoom: 19 };

    if (hasCartoKey) {
      if (tileSourceTier === 0) {
        tileUrl = hasViteCartoKey
          ? `https://{s}.basemaps.cartocdn.com/${
              darkMode ? 'dark_all' : 'rastertiles/voyager'
            }/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(rawViteKey)}`
          : `/api/tiles/${style}/{z}/{x}/{y}{r}.png`;
        if (hasViteCartoKey) options.subdomains = 'abcd';
      } else if (tileSourceTier === 1) {
        tileUrl =
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      } else {
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      }
    } else {
      if (tileSourceTier === 0) {
        tileUrl =
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      } else if (tileSourceTier === 1) {
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      } else {
        tileUrl = `/api/tiles/${style}/{z}/{x}/{y}{r}.png`;
      }
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
      if (!loadedAnyTile && errorCount >= 2 && tileSourceTier < 2) {
        setTileSourceTier((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));
      }
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [darkMode, tileSourceTier, hasCartoKey, hasViteCartoKey, rawViteKey]);

  const isNavigating = status === 'EN_ROUTE_PICKUP' || status === 'IN_PROGRESS';

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      (status === 'EN_ROUTE_PICKUP' || status === 'IN_PROGRESS') &&
      prevNavPhaseRef.current !== status
    ) {
      setFollowDriver(true);
      map.setView([driverPos.lat, driverPos.lng], 17, { animate: true });
    } else if (status === 'ONLINE_IDLE' && prevNavPhaseRef.current !== 'ONLINE_IDLE') {
      setFollowDriver(true);
      map.setView([driverPos.lat, driverPos.lng], 15, { animate: true });
    }

    if (status !== 'INCOMING_REQUEST') {
      fittedRequestIdRef.current = null;
    }

    prevNavPhaseRef.current = status;
  }, [status, driverPos.lat, driverPos.lng]);

  // Update Driver Navigation Puck & Camera Follow
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isOnline = status !== 'OFFLINE' && status !== 'ON_BREAK';
    const isBreak = status === 'ON_BREAK';
    const pulseHtml =
      status === 'ONLINE_IDLE'
        ? `<div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(52,209,134,0.28);animation:radar-pulse 2.2s cubic-bezier(0.16,1,0.3,1) infinite;"></div>`
        : '';

    const beamHtml = isNavigating
      ? `<div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);width:28px;height:26px;background:linear-gradient(to top, rgba(52,209,134,0.45), rgba(52,209,134,0));clip-path:polygon(15% 0%, 85% 0%, 60% 100%, 40% 100%);pointer-events:none;"></div>`
      : '';

    // When Heading-Up rotation rotates the map canvas by -driverHeading, keep puck arrow facing upward relative to screen!
    const puckRotate = headingUpNav && isNavigating ? driverHeading : driverHeading;
    const puckSize = isNavigating ? 42 : 36;
    const puckHtml = `
      <div style="position:relative;width:${puckSize}px;height:${puckSize}px;display:flex;align-items:center;justify-content:center;">
        ${pulseHtml}
        <div style="position:relative;width:${isNavigating ? 34 : 30}px;height:${
      isNavigating ? 34 : 30
    }px;border-radius:9999px;background:#0F172A;border:3px solid #FFFFFF;box-shadow:0 6px 16px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;transform:rotate(${puckRotate}deg);transition:transform 90ms linear;">
          ${beamHtml}
          <svg width="${isNavigating ? 18 : 16}" height="${
      isNavigating ? 18 : 16
    }" viewBox="0 0 24 24" fill="${isBreak ? '#F59E0B' : isOnline ? '#34D186' : '#94A3B8'}">
            <polygon points="12,2 20,20 12,15 4,20" />
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: '',
      html: puckHtml,
      iconSize: [puckSize, puckSize],
      iconAnchor: [puckSize / 2, puckSize / 2],
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
      if (isNavigating && !headingUpNav) {
        const rad = (driverHeading * Math.PI) / 180;
        const lookAheadDeg = 0.00075;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        const sheetOffsetLat = isMobile ? -0.00055 : 0;
        const targetLat = driverPos.lat + Math.cos(rad) * lookAheadDeg + sheetOffsetLat;
        const targetLng = driverPos.lng + Math.sin(rad) * lookAheadDeg;
        map.panTo([targetLat, targetLng], { animate: true, duration: 0.2 });
      } else {
        map.panTo([driverPos.lat, driverPos.lng], { animate: true, duration: 0.25 });
      }
    }
  }, [driverPos.lat, driverPos.lng, driverHeading, status, followDriver, isNavigating, headingUpNav]);

  // Render Surge Zones & Geofenced Airport/Stadium Taxi Ranks
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
        fillOpacity: 0.16,
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

    ranks.forEach((rank) => {
      const joined = activeRankId === rank.id;
      const distM = exactDistanceKm(driverPos, rank.center) * 1000;
      const insideGeofence = distM <= rank.geofenceRadiusMeters;
      const hubColor =
        rank.hubType === 'airport' ? '#38BDF8' : rank.hubType === 'stadium' ? '#A855F7' : '#25B670';

      L.circle([rank.center.lat, rank.center.lng], {
        radius: rank.geofenceRadiusMeters,
        color: joined ? '#34D186' : hubColor,
        weight: joined ? 2 : 1.25,
        dashArray: '5 6',
        opacity: joined ? 0.85 : 0.45,
        fillColor: joined ? '#34D186' : hubColor,
        fillOpacity: insideGeofence || joined ? 0.14 : 0.05,
      })
        .on('click', () => onSelectRank?.(rank))
        .addTo(group);

      const hubBadge =
        rank.hubType === 'airport' ? '✈' : rank.hubType === 'stadium' ? '🏟' : 'P';
      const labelText = joined
        ? `#${rankQueuePos ?? rank.queueCount} of ${rank.totalDrivers}`
        : `${rank.hubType === 'airport' ? 'Airport' : rank.hubType === 'stadium' ? 'Stadium' : 'Rank'} · ${rank.queueCount}/${rank.totalDrivers}`;

      const rankIcon = L.divIcon({
        className: '',
        html: `<div style="background:${
          joined ? '#25B670' : '#1E293B'
        };color:${joined ? '#0F172A' : '#FFFFFF'};font-size:10px;font-weight:800;padding:4px 9px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.28);white-space:nowrap;border:1.5px solid ${
          joined ? '#FFFFFF' : hubColor
        };display:inline-flex;align-items:center;gap:4px;">
          <span style="background:${
            joined ? '#0F172A' : hubColor
          };color:${joined ? '#34D186' : '#0F172A'};padding:1px 4px;border-radius:4px;font-weight:900;">${hubBadge}</span>
          <span>${labelText}</span>
        </div>`,
        iconSize: [112, 26],
        iconAnchor: [56, 13],
      });

      L.marker([rank.center.lat, rank.center.lng], { icon: rankIcon, zIndexOffset: 400 })
        .on('click', () => onSelectRank?.(rank))
        .addTo(group);
    });
  }, [surgeZones, ranks, activeRankId, rankQueuePos, status, driverPos.lat, driverPos.lng, onSelectSurgeZone, onSelectRank]);

  // Render Route Polylines, Multistop Pins, Destination & Full-Trip Zoom Out
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
          opacity: 0.88,
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
      if (isNavigating && currentRouteIndex > 0) {
        const traveled = activeRoute.slice(0, Math.min(activeRoute.length, currentRouteIndex + 1));
        if (traveled.length > 1) {
          L.polyline(
            traveled.map((p) => [p.lat, p.lng] as [number, number]),
            {
              color: '#64748B',
              weight: 5,
              opacity: 0.35,
            }
          ).addTo(group);
        }
        const ahead = [
          driverPos,
          ...activeRoute.slice(Math.min(activeRoute.length - 1, currentRouteIndex + 1)),
        ];
        if (ahead.length > 1) {
          const aheadLatLngs = ahead.map((p) => [p.lat, p.lng] as [number, number]);
          L.polyline(aheadLatLngs, {
            color: '#0F172A',
            weight: 9,
            opacity: 0.42,
          }).addTo(group);
          L.polyline(aheadLatLngs, {
            color: '#34D186',
            weight: 5.5,
            opacity: 0.98,
          }).addTo(group);
        }
      } else {
        const latlngs = activeRoute.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, {
          color: '#0F172A',
          weight: 8,
          opacity: 0.35,
        }).addTo(group);
        L.polyline(latlngs, {
          color: '#34D186',
          weight: 5,
          opacity: 0.96,
        }).addTo(group);
      }
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

    // Multistop Waypoint Pins
    if (
      activeRequest?.stops &&
      activeRequest.stops.length > 0 &&
      (status === 'INCOMING_REQUEST' || status === 'IN_PROGRESS')
    ) {
      activeRequest.stops.forEach((stop, idx) => {
        const stopIcon = L.divIcon({
          className: '',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);">
              <div style="background:#F59E0B;color:#0F172A;font-size:10px;font-weight:800;padding:2px 7px;border-radius:7px;white-space:nowrap;margin-bottom:3px;box-shadow:0 3px 8px rgba(0,0,0,0.25);">
                Stop ${idx + 1} · ${stop.area}
              </div>
              <div style="width:20px;height:20px;border-radius:9999px;background:#F59E0B;border:2.5px solid #fff;color:#0F172A;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.28);">
                ${idx + 1}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([stop.coords.lat, stop.coords.lng], { icon: stopIcon }).addTo(group);
      });
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

    if (status === 'INCOMING_REQUEST' && activeRequest && fittedRequestIdRef.current !== activeRequest.id) {
      fittedRequestIdRef.current = activeRequest.id;
      const allPoints: LatLng[] = [
        driverPos,
        activeRequest.pickupCoords,
        ...(activeRequest.stops?.map((s) => s.coords) || []),
        activeRequest.dropoffCoords,
        ...activeRoute,
        ...previewDropoffRoute,
      ];
      const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng] as [number, number]));
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      const bottomPad = isMobile ? Math.min(380, Math.round(window.innerHeight * 0.46)) : 120;
      map.fitBounds(bounds, {
        paddingTopLeft: [36, 76],
        paddingBottomRight: [48, bottomPad],
        maxZoom: 14,
        animate: true,
      });
      setFollowDriver(false);
    }
  }, [
    status,
    activeRequest,
    activeRoute,
    previewDropoffRoute,
    currentRouteIndex,
    destinationTarget,
    darkMode,
    isNavigating,
    driverPos.lat,
    driverPos.lng,
  ]);

  const handleRecenter = () => {
    setFollowDriver(true);
    mapRef.current?.setView([driverPos.lat, driverPos.lng], isNavigating ? 17 : 15, {
      animate: true,
    });
  };

  const distToManeuverMeters = useMemo(() => {
    const targetIdx = nextManeuver?.pointIndex ?? activeRoute.length - 1;
    if (activeRoute.length > 1 && targetIdx > currentRouteIndex) {
      let km = exactDistanceKm(
        driverPos,
        activeRoute[Math.min(activeRoute.length - 1, currentRouteIndex + 1)]
      );
      const end = Math.min(activeRoute.length - 1, targetIdx);
      for (let i = currentRouteIndex + 1; i < end; i++) {
        km += exactDistanceKm(activeRoute[i], activeRoute[i + 1]);
      }
      const m = Math.round(km * 1000);
      return m > 100 ? Math.round(m / 10) * 10 : Math.max(10, Math.round(m / 5) * 5);
    }
    const target =
      status === 'EN_ROUTE_PICKUP' ? activeRequest?.pickupCoords : activeRequest?.dropoffCoords;
    if (target) {
      return Math.max(10, Math.round(exactDistanceKm(driverPos, target) * 1000));
    }
    return currentManeuver?.distanceMeters || 120;
  }, [activeRoute, currentRouteIndex, driverPos, nextManeuver, currentManeuver, status, activeRequest]);

  const etaClock = useMemo(() => {
    const d = new Date(Date.now() + remainingEtaMin * 60 * 1000);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }, [remainingEtaMin]);

  const currentCityName =
    WORLD_CITIES.find((c) => c.id === currentCityId)?.name || 'London';

  const rangePct = Math.round((activeVehicle.rangeKm / Math.max(1, activeVehicle.maxRangeKm)) * 100);
  const lowRangeWarning = rangePct <= 25;

  const renderDirectionIcon = (dir?: 'left' | 'right' | 'straight', sizeClass = 'w-5 h-5 sm:w-6 sm:h-6') => {
    if (dir === 'left') return <CornerUpLeft className={`${sizeClass} stroke-[2.5]`} />;
    if (dir === 'right') return <CornerUpRight className={`${sizeClass} stroke-[2.5]`} />;
    return <Navigation className={`${sizeClass} stroke-[2.5]`} />;
  };

  const mapRotationStyle: React.CSSProperties | undefined =
    headingUpNav && isNavigating && followDriver
      ? {
          transform: `rotate(${-driverHeading}deg) scale(1.42)`,
          transition: 'transform 220ms linear',
        }
      : {
          transform: 'rotate(0deg) scale(1)',
          transition: 'transform 220ms ease-out',
        };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        darkMode ? 'bg-[#14181F]' : 'bg-[#EEF1F4]'
      } ${darkMode && !usingTrueDarkCarto ? 'bolt-dark-tiles' : ''}`}
    >
      {/* Rotatable Leaflet World Map Wrapper for North-Up / Heading-Up */}
      <div className="w-full h-full" style={mapRotationStyle}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* D3 Geospatial District Demand Heatmap & Busy-Soon Forecast Overlay */}
      <D3DemandHeatmap
        map={mapInstance}
        zones={districtDemandZones}
        visible={showHeatmap && !isNavigating}
        darkMode={darkMode}
        onFocusCoords={(coords) => {
          setFollowDriver(false);
          mapRef.current?.setView([coords.lat, coords.lng], 15, { animate: true });
        }}
        onClose={onToggleHeatmap}
      />

      {/* Low EV / Fuel Range Guard Suggestion Banner */}
      {lowRangeWarning && !isNavigating && !showHeatmap && (
        <div className="absolute top-[max(3.85rem,calc(env(safe-area-inset-top)+3.15rem))] left-2.5 right-[54px] lg:left-5 lg:right-auto lg:w-[400px] z-[395]">
          <div className="rounded-2xl p-2.5 bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {activeVehicle.fuelType === 'Electric' ? (
                <BatteryCharging className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div className="text-[11px] min-w-0">
                <div className="font-extrabold text-amber-950 dark:text-amber-200 truncate">
                  Low {activeVehicle.fuelType === 'Electric' ? 'Battery' : 'Fuel'} · {activeVehicle.rangeKm} km left
                </div>
                <div className="text-amber-800/80 dark:text-amber-300/80 truncate">
                  Out-of-city Bolt City jobs paused until recharge
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefuelOrCharge}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-extrabold shrink-0"
            >
              {activeVehicle.fuelType === 'Electric' ? 'Charge' : 'Refuel'}
            </button>
          </div>
        </div>
      )}

      {/* Top Real-Time Turn-by-Turn Navigation HUD */}
      {isNavigating && (
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-2.5 right-[52px] sm:left-4 sm:right-auto sm:w-[400px] z-[400] pointer-events-auto space-y-1.5">
          <div className="bg-[#0F172A] text-white rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-white/10 flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#34D186] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              {renderDirectionIcon(currentManeuver?.direction)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-extrabold font-mono-num tracking-tight">
                  {distToManeuverMeters >= 1000
                    ? `${(distToManeuverMeters / 1000).toFixed(1)} km`
                    : `${distToManeuverMeters} m`}
                </span>
                <span className="text-[11px] sm:text-xs text-[#34D186] font-bold whitespace-nowrap">
                  {isRerouting
                    ? 'Rerouting via OSRM...'
                    : status === 'EN_ROUTE_PICKUP'
                    ? 'To pickup'
                    : activeRequest?.stops && activeRequest.stops.length > 0
                    ? `To stop / dropoff`
                    : 'To destination'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 font-semibold truncate">
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
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {nextManeuver && (
              <div className="inline-flex items-center gap-1.5 bg-slate-900/92 text-slate-100 rounded-xl px-2.5 py-1.5 text-[11px] font-bold shadow-lg border border-white/10 max-w-full truncate">
                <span className="text-slate-400 font-semibold">Then</span>
                <span className="text-[#34D186] shrink-0">
                  {renderDirectionIcon(nextManeuver.direction, 'w-3.5 h-3.5')}
                </span>
                <span className="truncate">{nextManeuver.streetName}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold shadow-lg border border-slate-200/80 dark:border-slate-700 font-mono-num">
              <span className="inline-flex items-center gap-1 text-[#25B670]">
                <Gauge className="w-3.5 h-3.5" />
                {navSpeedKmh} km/h
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{remainingEtaMin} min</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{remainingDistKm.toFixed(1)} km</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">ETA {etaClock}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Recenter Button when panned away */}
      {!followDriver && status !== 'INCOMING_REQUEST' && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute left-3 bottom-[calc(14.5rem+env(safe-area-inset-bottom,0px))] lg:left-[440px] lg:bottom-6 z-[410] px-3.5 h-10 rounded-full bg-slate-950 text-white border border-white/15 shadow-xl text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Compass className="w-4 h-4 text-[#34D186]" />
          <span>Recenter</span>
        </button>
      )}

      {/* Right Floating Map Controls — compact on phones, non-overlapping vertical rail */}
      <div
        className={`absolute right-2.5 sm:right-3 z-[420] flex flex-col gap-1.5 sm:gap-2 ${
          isNavigating
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

        {!isNavigating && (
          <button
            type="button"
            onClick={onToggleHeatmap}
            aria-label="Toggle D3 Demand Heatmap"
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center active:scale-95 transition-all ${
              showHeatmap
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-white/95 dark:bg-slate-900/95 text-orange-500 border-slate-200/80 dark:border-slate-700'
            }`}
            title="D3 Demand Heatmap & Peak Hours"
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleLiveGps}
          aria-label="Toggle Live Phone GPS vs Simulated Drive"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center active:scale-95 transition-all ${
            isLiveGps
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title={
            gpsLoading
              ? 'Locating GPS...'
              : isLiveGps
              ? 'Live Phone GPS Active (tap for Simulated Drive)'
              : 'Simulated Drive (tap for Live Phone GPS)'
          }
        >
          <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
        </button>

        {!isNavigating && (
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
        )}

        <button
          type="button"
          onClick={onToggleHeadingUp}
          aria-label="Toggle North-Up / Heading-Up view"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all ${
            headingUpNav
              ? 'bg-[#34D186] text-slate-950 border-[#28B872]'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title={headingUpNav ? 'Heading-Up Rotation ON (tap for North-Up)' : '2D North-Up View (tap for Heading-Up)'}
        >
          <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map on vehicle"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-md shadow-lg border flex items-center justify-center transition-all ${
            followDriver
              ? 'bg-slate-900 text-[#34D186] border-slate-700'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
          }`}
          title={followDriver ? 'Following Vehicle' : 'Tap to Recenter Camera'}
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
