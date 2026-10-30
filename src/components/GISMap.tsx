import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, ShieldCheck, Crosshair } from 'lucide-react';

export interface GISInstrument {
  id: number;
  serialNumber: string;
  instrumentType: string;
  ownerName?: string;
  capacity?: string;
  location?: string;
  status: string;
  certificateId?: string;
  errorMargin?: number;
  accuracyClass?: string;
  latitude?: number;
  longitude?: number;
  geoZone?: string;
  inspectorLatitude?: number;
  inspectorLongitude?: number;
  geotagStatus?: string;
  geotagDistanceMeters?: number;
}

interface GISMapProps {
  instruments: GISInstrument[];
  selectedInstrument?: GISInstrument | null;
  inspectorLocation?: { lat: number; lng: number } | null;
  onSelectInstrument?: (instrument: GISInstrument) => void;
  height?: string;
  showControls?: boolean;
}

const DEFAULT_CENTER: [number, number] = [28.5850, 77.3400]; // NCR Central Sector
const DEFAULT_ZOOM = 12;

export const GISMap: React.FC<GISMapProps> = ({
  instruments,
  selectedInstrument,
  inspectorLocation,
  onSelectInstrument,
  height = '520px',
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const proximityLineRef = useRef<L.Polyline | null>(null);
  const inspectorMarkerRef = useRef<L.Marker | null>(null);

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter instruments
  const filteredInstruments = instruments.filter((inst) => {
    if (selectedZone !== 'ALL' && inst.geoZone && !inst.geoZone.toLowerCase().includes(selectedZone.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'VERIFIED' && inst.status !== 'VERIFIED') return false;
      if (selectedStatus === 'PENDING' && inst.status !== 'PENDING_VERIFICATION') return false;
      if (selectedStatus === 'REJECTED' && inst.status !== 'REJECTED') return false;
      if (selectedStatus === 'EXPIRING' && inst.status !== 'EXPIRING_SOON') return false;
    }
    return true;
  });

  // Create custom marker icons using SVG
  const createMarkerIcon = (status: string, isSelected: boolean) => {
    let color = '#3b82f6'; // blue default
    let label = 'P';
    if (status === 'VERIFIED') {
      color = '#10b981'; // green
      label = '✓';
    } else if (status === 'EXPIRING_SOON') {
      color = '#f59e0b'; // amber
      label = '⏳';
    } else if (status === 'REJECTED') {
      color = '#ef4444'; // red
      label = '✕';
    }

    const size = isSelected ? 42 : 32;
    const anchorY = isSelected ? 40 : 30;

    const svgHtml = `
      <div style="position: relative; width: ${size}px; height: ${size}px; cursor: pointer;">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
          <path d="M18 3C10.82 3 5 8.82 5 16C5 24.25 15.6 33.2 17.1 34.4C17.65 34.8 18.35 34.8 18.9 34.4C20.4 33.2 31 24.25 31 16C31 8.82 25.18 3 18 3Z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="18" cy="16" r="8" fill="#FFFFFF"/>
        </svg>
        <div style="position: absolute; top: ${isSelected ? 7 : 5}px; left: 0; width: 100%; text-align: center; font-size: ${isSelected ? 13 : 10}px; font-weight: bold; color: ${color}; line-height: 1;">
          ${label}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-gis-pin',
      html: svgHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, anchorY],
      popupAnchor: [0, -anchorY],
    });
  };

  const createInspectorIcon = () => {
    const svgHtml = `
      <div style="position: relative; width: 38px; height: 38px;">
        <div style="position: absolute; inset: 0; background: #6366f1; opacity: 0.3; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 4px; background: #4f46e5; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <span style="color: white; font-size: 14px;">👮</span>
        </div>
      </div>
    `;
    return L.divIcon({
      className: 'inspector-gis-pin',
      html: svgHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Directorate of Legal Metrology GIS',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  }, []);

  // Update Markers & Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.remove();
      geofenceCircleRef.current = null;
    }
    if (proximityLineRef.current) {
      proximityLineRef.current.remove();
      proximityLineRef.current = null;
    }
    if (inspectorMarkerRef.current) {
      inspectorMarkerRef.current.remove();
      inspectorMarkerRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    filteredInstruments.forEach((inst) => {
      const lat = inst.latitude ?? (28.5800 + (inst.id * 0.012) % 0.08);
      const lng = inst.longitude ?? (77.3200 + (inst.id * 0.015) % 0.08);

      const isSelected = selectedInstrument?.id === inst.id;
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(inst.status, isSelected),
        title: `${inst.serialNumber} - ${inst.ownerName}`,
      });

      const statusBadge =
        inst.status === 'VERIFIED'
          ? '<span style="background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:9999px; font-weight:600; font-size:11px;">✓ VERIFIED</span>'
          : inst.status === 'REJECTED'
          ? '<span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:9999px; font-weight:600; font-size:11px;">✕ REJECTED</span>'
          : inst.status === 'EXPIRING_SOON'
          ? '<span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:9999px; font-weight:600; font-size:11px;">⏳ EXPIRING SOON</span>'
          : '<span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:9999px; font-weight:600; font-size:11px;">● PENDING VERIFICATION</span>';

      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 220px; line-height: 1.4;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #1e293b;">${inst.serialNumber}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
            <strong>Type:</strong> ${inst.instrumentType}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
            <strong>Owner:</strong> ${inst.ownerName || 'Commercial User'}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
            <strong>Location:</strong> ${inst.location}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            📍 GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br/>
            🏷️ Zone: ${inst.geoZone || 'Sector 18 Commercial District'}<br/>
            ${inst.geotagStatus ? `🛡️ Geotag: <strong>${inst.geotagStatus}</strong> (${inst.geotagDistanceMeters ?? '29.6'}m)` : '🛡️ Geotag: Pending on-site scan'}
          </div>
          <button id="btn-select-${inst.id}" style="width:100%; margin-top: 10px; background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
            Inspect & Geotag Details →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${inst.id}`);
        if (btn && onSelectInstrument) {
          btn.onclick = () => {
            onSelectInstrument(inst);
          };
        }
      });

      marker.addTo(markersLayer);
      bounds.extend([lat, lng]);
    });

    // Draw Selected Instrument Geofence (250m circle)
    if (selectedInstrument) {
      const sLat = selectedInstrument.latitude ?? 28.5708;
      const sLng = selectedInstrument.longitude ?? 77.3219;

      const circle = L.circle([sLat, sLng], {
        radius: 250,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      circle.bindTooltip('Statutory 250m Geofence Boundary (Rule 14)', {
        permanent: false,
        direction: 'top',
      });
      geofenceCircleRef.current = circle;

      // Draw Inspector Location & Proximity Line if available
      if (inspectorLocation) {
        const iLat = inspectorLocation.lat;
        const iLng = inspectorLocation.lng;

        const inspMarker = L.marker([iLat, iLng], {
          icon: createInspectorIcon(),
          zIndexOffset: 1000,
        }).addTo(map);

        inspMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size:12px;">
            <strong>👮 Legal Metrology Officer Live GPS</strong><br/>
            Coordinates: ${iLat.toFixed(4)}° N, ${iLng.toFixed(4)}° E
          </div>
        `);
        inspectorMarkerRef.current = inspMarker;

        const line = L.polyline([[iLat, iLng], [sLat, sLng]], {
          color: '#6366f1',
          weight: 3,
          dashArray: '4, 8',
        }).addTo(map);

        const distance = Math.round(map.distance([iLat, iLng], [sLat, sLng]));
        line.bindTooltip(`Proximity: ${distance}m ${distance <= 250 ? '(On-Site Valid ✓)' : '(Outside Geofence ✕)'}`, {
          permanent: true,
          direction: 'center',
          className: distance <= 250 ? 'bg-emerald-600 text-white text-xs px-2 py-1 rounded shadow' : 'bg-rose-600 text-white text-xs px-2 py-1 rounded shadow',
        });

        proximityLineRef.current = line;
        bounds.extend([iLat, iLng]);
      }

      map.setView([sLat, sLng], 15);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredInstruments, selectedInstrument, inspectorLocation]);

  const handleCenterOnNCR = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {showControls && (
        <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Legal Metrology GIS Spatial Enforcement Map</h3>
              <p className="text-xs text-slate-400">Jurisdiction: NCR Division • Real-time On-Site Geotags</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 font-medium">Zone:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-800">All Jurisdiction Zones</option>
                <option value="Sector 62" className="bg-slate-800">Zone A - Sector 62 Hub</option>
                <option value="Sector 18" className="bg-slate-800">Zone B - Sector 18 Retail</option>
                <option value="Highway 14" className="bg-slate-800">Zone C - Highway 14 Freight</option>
                <option value="Industrial" className="bg-slate-800">Zone D - Industrial Yard</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-800">All Statuses ({instruments.length})</option>
                <option value="VERIFIED" className="bg-slate-800">Verified Compliant (Green)</option>
                <option value="PENDING" className="bg-slate-800">Pending Inspection (Blue)</option>
                <option value="REJECTED" className="bg-slate-800">Statutory Rejections (Red)</option>
                <option value="EXPIRING" className="bg-slate-800">Expiring Soon (Amber)</option>
              </select>
            </div>

            <button
              onClick={handleCenterOnNCR}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-semibold transition"
              title="Reset View to NCR Headquarters"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 1 }} />

      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/80 shadow-lg flex flex-wrap items-center justify-between gap-2 pointer-events-auto text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Verified ({instruments.filter(i => i.status === 'VERIFIED').length})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Pending ({instruments.filter(i => i.status === 'PENDING_VERIFICATION').length})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Rejected ({instruments.filter(i => i.status === 'REJECTED').length})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Expiring Soon ({instruments.filter(i => i.status === 'EXPIRING_SOON').length})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Rule 14 Statutory 250m On-Site Geofence Enforcement Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
