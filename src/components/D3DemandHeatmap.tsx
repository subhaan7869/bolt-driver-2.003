import React from 'react';

export interface D3DemandHeatmapProps {
  map?: any;
  zones?: any[];
  visible?: boolean;
  darkMode?: boolean;
  onFocusCoords?: (coords: { lat: number; lng: number }) => void;
  onClose?: () => void;
  active?: boolean;
}

export const D3DemandHeatmap: React.FC<D3DemandHeatmapProps> = () => {
  return null;
};
