"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search, Navigation, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { searchLocations, reverseGeocode } from "@/lib/location";
import type { LocationResult } from "@/types";
import { cn } from "@/lib/utils";

// Leaflet is imported dynamically to avoid SSR errors
const MapComponent = dynamic(() => import("./LeafletMap"), { ssr: false });

type TabId = "search" | "detect" | "map";

interface LocationPickerProps {
  value: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  error?: string;
  label?: string;
}

export default function LocationPicker({
  value,
  onChange,
  error,
  label = "Location"
}: LocationPickerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleDetect = useCallback(async () => {
    setDetectError("");
    setIsDetecting(true);
    if (!navigator.geolocation) {
      setDetectError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          if (result) {
            onChange(result);
          } else {
            setDetectError("Unable to determine address. Please search manually.");
          }
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setDetectError("Unable to detect location. Please search manually.");
        setIsDetecting(false);
      }
    );
  }, [onChange]);

  const handleMapSelect = useCallback(
    async (lat: number, lng: number) => {
      const result = await reverseGeocode(lat, lng);
      if (result) onChange(result);
    },
    [onChange]
  );

  const tabs: Array<{ id: TabId; label: string; icon: typeof Search }> = [
    { id: "search", label: "Search", icon: Search },
    { id: "detect", label: "Detect", icon: Navigation },
    { id: "map", label: "Map", icon: MapPin }
  ];

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {/* Tab bar */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                activeTab === tab.id
                  ? "bg-white text-[#1E40AF] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search tab */}
      {activeTab === "search" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, clinic name…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          {searchResults.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {searchResults.map((result, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(result);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]" />
                    <span className="text-sm text-slate-700">{result.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Detect tab */}
      {activeTab === "detect" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDetect}
            disabled={isDetecting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-sm font-semibold text-slate-600 transition hover:border-[#1E40AF] hover:bg-blue-50 hover:text-[#1E40AF] disabled:opacity-60"
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Detecting your location…
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                Detect My Location
              </>
            )}
          </button>

          {detectError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {detectError}
            </div>
          )}

          {value && !detectError && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {value.displayName}
            </div>
          )}
        </div>
      )}

      {/* Map tab */}
      {activeTab === "map" && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <MapComponent
            onSelect={handleMapSelect}
            selectedLat={value?.lat}
            selectedLng={value?.lng}
          />
        </div>
      )}

      {/* Selected location pill */}
      {value && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="flex-1 truncate text-sm font-medium text-emerald-800">
            {value.displayName}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-0.5 text-emerald-600 transition hover:bg-emerald-200"
            aria-label="Clear location"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Validation error */}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
