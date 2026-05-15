"use client";

/**
 * LeafletMap.tsx
 *
 * This file is intentionally isolated from LocationPicker and loaded only via
 * Next.js dynamic import with { ssr: false } to prevent "window is not defined"
 * errors during server-side rendering.
 */

import { useEffect, useRef } from "react";

// Leaflet CSS must be imported here alongside the library
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's broken default marker icon paths when bundled with webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LeafletMapProps {
  onSelect: (lat: number, lng: number) => void;
  selectedLat?: number;
  selectedLng?: number;
}

// Hyderabad center coordinates
const HYDERABAD_LAT = 17.385;
const HYDERABAD_LNG = 78.4867;
const DEFAULT_ZOOM = 12;

export default function LeafletMap({ onSelect, selectedLat, selectedLng }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialise the map once the container div is mounted
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [selectedLat ?? HYDERABAD_LAT, selectedLng ?? HYDERABAD_LNG],
      zoom: DEFAULT_ZOOM,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Place an initial marker if coordinates were pre-selected
    if (selectedLat !== undefined && selectedLng !== undefined) {
      markerRef.current = L.marker([selectedLat, selectedLng], {
        icon: defaultIcon,
        draggable: true
      })
        .addTo(map)
        .bindPopup("Drag to adjust")
        .openPopup();

      markerRef.current.on("dragend", (e: L.DragEndEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onSelect(lat, lng);
      });
    }

    // Click anywhere on the map to drop/move the pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          icon: defaultIcon,
          draggable: true
        })
          .addTo(map)
          .bindPopup("Drag to adjust")
          .openPopup();

        markerRef.current.on("dragend", (ev: L.DragEndEvent) => {
          const pos = (ev.target as L.Marker).getLatLng();
          onSelect(pos.lat, pos.lng);
        });
      }
      onSelect(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position when external value changes (e.g. from detect tab)
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedLat === undefined || selectedLng === undefined) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([selectedLat, selectedLng]);
    } else {
      markerRef.current = L.marker([selectedLat, selectedLng], {
        icon: defaultIcon,
        draggable: true
      }).addTo(mapRef.current);
    }

    mapRef.current.setView([selectedLat, selectedLng], DEFAULT_ZOOM, {
      animate: true
    });
  }, [selectedLat, selectedLng]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full rounded-xl"
      aria-label="Map — click to select a location"
    />
  );
}
