import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { Clock, Flame, MapPin, TrendingUp, X } from 'lucide-react';
import { DistrictDemandZone, LatLng } from '../types/driver';

interface D3DemandHeatmapProps {
  map: L.Map | null;
  zones: DistrictDemandZone[];
  visible: boolean;
  darkMode: boolean;
  onFocusCoords: (coords: LatLng, label: string) => void;
  onClose: () => void;
}

const HEAT_INTERPOLATOR = d3.interpolateRgbBasis(['#34D186', '#FBBF24', '#F97316', '#EF4444']);

export const D3DemandHeatmap: React.FC<D3DemandHeatmapProps> = ({
  map,
  zones,
  visible,
  darkMode,
  onFocusCoords,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const hourChartRef = useRef<SVGSVGElement>(null);
  const districtSparkRef = useRef<SVGSVGElement>(null);

  const currentHour = new Date().getHours();
  const [selectedHour, setSelectedHour] = useState<number>(currentHour);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  // Sync SVG projection whenever Leaflet map pans or zooms
  useEffect(() => {
    if (!map || !visible) return;
    const bump = () => setMapVersion((v) => v + 1);
    map.on('move', bump);
    map.on('zoom', bump);
    map.on('viewreset', bump);
    map.on('resize', bump);
    bump();
    return () => {
      map.off('move', bump);
      map.off('zoom', bump);
      map.off('viewreset', bump);
      map.off('resize', bump);
    };
  }, [map, visible]);

  // D3 Map Spatial Heatmap Layer (Radial Heat Blobs + District Labels)
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !map || !visible) return;

    const size = map.getSize();
    const svg = d3.select(svgEl);
    svg.attr('width', size.x).attr('height', size.y);

    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) defs = svg.append('defs');

    let layer = svg.select<SVGGElement>('g.d3-heat-layer');
    if (layer.empty()) layer = svg.append('g').attr('class', 'd3-heat-layer');

    const colorScale = d3.scaleSequential(HEAT_INTERPOLATOR).domain([0.15, 1.0]);

    const projected = zones.map((zone) => {
      const centerPt = map.latLngToContainerPoint([zone.center.lat, zone.center.lng]);
      // Offset ~radiusMeters northward to compute accurate pixel radius at current zoom
      const dLat = zone.radiusMeters / 111320;
      const edgePt = map.latLngToContainerPoint([zone.center.lat + dLat, zone.center.lng]);
      const pxRadius = Math.max(26, Math.min(180, Math.abs(centerPt.y - edgePt.y) * 1.35));
      const intensity = zone.hourlyScores[selectedHour] ?? 0.5;
      return {
        zone,
        x: centerPt.x,
        y: centerPt.y,
        r: pxRadius * (0.78 + intensity * 0.48),
        intensity,
        color: colorScale(intensity),
      };
    });

    // Build radial gradients via D3 data join
    const grads = defs
      .selectAll<SVGRadialGradientElement, (typeof projected)[0]>('radialGradient.heat-grad')
      .data(projected, (d) => d.zone.id);

    const gradsEnter = grads
      .enter()
      .append('radialGradient')
      .attr('class', 'heat-grad')
      .attr('id', (d) => `heat-grad-${d.zone.id}`);
    gradsEnter.append('stop').attr('offset', '0%').attr('class', 's0');
    gradsEnter.append('stop').attr('offset', '55%').attr('class', 's1');
    gradsEnter.append('stop').attr('offset', '100%').attr('class', 's2');

    const gradsMerged = gradsEnter.merge(grads);
    gradsMerged
      .select('stop.s0')
      .attr('stop-color', (d) => d.color)
      .attr('stop-opacity', (d) => 0.35 + d.intensity * 0.38);
    gradsMerged
      .select('stop.s1')
      .attr('stop-color', (d) => d.color)
      .attr('stop-opacity', (d) => 0.14 + d.intensity * 0.16);
    gradsMerged.select('stop.s2').attr('stop-color', (d) => d.color).attr('stop-opacity', 0);
    grads.exit().remove();

    // Render interactive D3 hotspot nodes
    const nodes = layer
      .selectAll<SVGGElement, (typeof projected)[0]>('g.heat-node')
      .data(projected, (d) => d.zone.id);

    const nodesEnter = nodes
      .enter()
      .append('g')
      .attr('class', 'heat-node')
      .style('cursor', 'pointer')
      .style('pointer-events', 'auto');

    nodesEnter.append('circle').attr('class', 'heat-blob');
    nodesEnter.append('circle').attr('class', 'heat-ring');
    nodesEnter.append('text').attr('class', 'heat-label');

    const nodesMerged = nodesEnter.merge(nodes);
    nodesMerged
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedZoneId((prev) => (prev === d.zone.id ? null : d.zone.id));
      });

    nodesMerged
      .select<SVGCircleElement>('circle.heat-blob')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => `url(#heat-grad-${d.zone.id})`);

    nodesMerged
      .select<SVGCircleElement>('circle.heat-ring')
      .attr('r', (d) => Math.max(12, d.r * 0.28))
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.22)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (d) => (d.zone.id === selectedZoneId ? 2.5 : 1.25))
      .attr('stroke-dasharray', (d) => (d.zone.id === selectedZoneId ? 'none' : '3 3'));

    nodesMerged
      .select<SVGTextElement>('text.heat-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('fill', darkMode ? '#FFFFFF' : '#0F172A')
      .attr('paint-order', 'stroke')
      .attr('stroke', darkMode ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)')
      .attr('stroke-width', 3)
      .text((d) => `${d.zone.district} · ${Math.round(d.intensity * 100)}%`);

    nodes.exit().remove();
  }, [map, zones, visible, selectedHour, selectedZoneId, mapVersion, darkMode]);

  // D3 24-Hour City Demand Bar Chart
  useEffect(() => {
    const el = hourChartRef.current;
    if (!el || !visible || zones.length === 0) return;

    const hourlyAvg = Array.from({ length: 24 }, (_, h) => {
      const sum = zones.reduce((acc, z) => acc + (z.hourlyScores[h] ?? 0), 0);
      return { hour: h, avg: sum / zones.length };
    });

    const width = 288;
    const height = 52;
    const svg = d3.select(el);
    svg.selectAll('*').remove();

    const x = d3
      .scaleBand<number>()
      .domain(hourlyAvg.map((d) => d.hour))
      .range([2, width - 2])
      .padding(0.2);

    const y = d3.scaleLinear().domain([0, 1]).range([height - 14, 4]);
    const colorScale = d3.scaleSequential(HEAT_INTERPOLATOR).domain([0.15, 1.0]);

    svg
      .selectAll('rect.hour-bar')
      .data(hourlyAvg)
      .enter()
      .append('rect')
      .attr('class', 'hour-bar')
      .attr('x', (d) => x(d.hour) || 0)
      .attr('y', (d) => y(d.avg))
      .attr('width', x.bandwidth())
      .attr('height', (d) => Math.max(4, height - 14 - y(d.avg)))
      .attr('rx', 2.5)
      .attr('fill', (d) =>
        d.hour === selectedHour ? '#34D186' : colorScale(d.avg)
      )
      .attr('opacity', (d) => (d.hour === selectedHour ? 1 : 0.45))
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedHour(d.hour));

    const ticks = [0, 6, 12, 18, 23];
    svg
      .selectAll('text.hour-tick')
      .data(ticks)
      .enter()
      .append('text')
      .attr('x', (h) => (x(h) || 0) + x.bandwidth() / 2)
      .attr('y', height - 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', darkMode ? '#94A3B8' : '#64748B')
      .text((h) => `${h.toString().padStart(2, '0')}h`);
  }, [zones, visible, selectedHour, darkMode]);

  // D3 Sparkline for selected district's 24h curve
  useEffect(() => {
    const el = districtSparkRef.current;
    if (!el || !selectedZone) return;

    const width = 230;
    const height = 38;
    const svg = d3.select(el);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear().domain([0, 23]).range([4, width - 4]);
    const y = d3.scaleLinear().domain([0, 1]).range([height - 4, 4]);

    const area = d3
      .area<number>()
      .x((_, i) => x(i))
      .y0(height - 4)
      .y1((d) => y(d))
      .curve(d3.curveCatmullRom);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveCatmullRom);

    svg
      .append('path')
      .datum(selectedZone.hourlyScores)
      .attr('d', area)
      .attr('fill', 'rgba(52, 209, 134, 0.22)');

    svg
      .append('path')
      .datum(selectedZone.hourlyScores)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#34D186')
      .attr('stroke-width', 2);

    svg
      .append('circle')
      .attr('cx', x(selectedHour))
      .attr('cy', y(selectedZone.hourlyScores[selectedHour] ?? 0.5))
      .attr('r', 4)
      .attr('fill', '#F97316')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5);
  }, [selectedZone, selectedHour]);

  const busySoonTop = useMemo(() => {
    if (zones.length === 0) return null;
    const nextHour = (currentHour + 1) % 24;
    return [...zones].sort(
      (a, b) =>
        (b.hourlyScores[nextHour] ?? 0) * b.forecastMultiplier -
        (a.hourlyScores[nextHour] ?? 0) * a.forecastMultiplier
    )[0];
  }, [zones, currentHour]);

  if (!visible) return null;

  return (
    <>
      {/* Synchronized D3 SVG Layer over Map Canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0 z-[260] pointer-events-none"
        aria-label="D3 Demand Heatmap Overlay"
      />

      {/* Compact D3 Historical Peak & Busy-Soon Forecast Controls */}
      <div className="absolute top-[max(3.85rem,calc(env(safe-area-inset-top)+3.15rem))] left-2.5 right-[54px] sm:left-4 sm:right-auto sm:w-[336px] z-[405] pointer-events-auto space-y-1.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Flame className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                Demand Heatmap · {selectedHour.toString().padStart(2, '0')}:00
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {([0, 1, 2] as const).map((offset) => {
                const targetH = (currentHour + offset) % 24;
                const active = selectedHour === targetH;
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => setSelectedHour(targetH)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                      active
                        ? 'bg-[#34D186] text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {offset === 0 ? 'Now' : `+${offset}h`}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onClose}
                aria-label="Hide demand heatmap"
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive D3 24h District Activity Bar Chart */}
          <svg
            ref={hourChartRef}
            viewBox="0 0 288 52"
            className="w-full h-12 overflow-visible"
            aria-label="Hourly demand distribution chart"
          />

          {/* Busy Soon (+1–2h) Forecast Callout */}
          {busySoonTop && (
            <button
              type="button"
              onClick={() => {
                setSelectedZoneId(busySoonTop.id);
                onFocusCoords(busySoonTop.center, busySoonTop.district);
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 flex items-center justify-between gap-2 text-left hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-amber-950 dark:text-amber-200 truncate">
                    Busy Soon: {busySoonTop.district} ({busySoonTop.forecastMultiplier.toFixed(1)}x)
                  </div>
                  <div className="text-[10px] text-amber-800/80 dark:text-amber-300/80 truncate">
                    {busySoonTop.busySoonLabel} · {busySoonTop.forecastOffsetLabel}
                  </div>
                </div>
              </div>
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            </button>
          )}
        </div>

        {/* Selected District Historical Peak Profile Card */}
        {selectedZone && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                  {selectedZone.district} · Peak {selectedZone.peakWindow}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 text-[#25B670] shrink-0" />
                  <span>{selectedZone.busySoonLabel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZoneId(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                aria-label="Close district breakdown"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <svg ref={districtSparkRef} viewBox="0 0 230 38" className="w-full h-9" />
          </div>
        )}
      </div>
    </>
  );
};
