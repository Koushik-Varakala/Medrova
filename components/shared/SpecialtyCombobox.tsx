"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialtyComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SpecialtyCombobox({
  options,
  value,
  onChange,
  placeholder = "Select or type a specialty...",
  className,
  disabled,
}: SpecialtyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const showAddCustom =
    query.trim() &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(option: string) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  function handleAddCustom() {
    const trimmed = query.trim();
    if (trimmed) {
      onChange(trimmed);
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-left transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
          open && "ring-2 ring-blue-500 border-blue-500"
        )}
      >
        <span className={cn(!value && "text-slate-400")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (showAddCustom) handleAddCustom();
                  else if (filtered.length === 1) handleSelect(filtered[0]);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
              }}
              placeholder="Search or type your own..."
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
                    value === option && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  {value === option && (
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                  <span className={value === option ? "" : "ml-6"}>{option}</span>
                </button>
              </li>
            ))}

            {/* Add custom option */}
            {showAddCustom && (
              <li>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Add &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}

            {filtered.length === 0 && !showAddCustom && (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">
                No specialties found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Multi-select variant for clinics picking multiple specialties ──────────────

interface SpecialtyMultiComboboxProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SpecialtyMultiCombobox({
  options,
  value,
  onChange,
  placeholder = "Select specialties needed...",
  className,
  disabled,
}: SpecialtyMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const showAddCustom =
    query.trim() &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  function handleAddCustom() {
    const trimmed = query.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-left transition-all",
          "focus:outline-none hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
          open && "ring-2 ring-blue-500 border-blue-500"
        )}
      >
        {value.length === 0 ? (
          <span className="text-slate-400 flex-1">{placeholder}</span>
        ) : (
          value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter((i) => i !== v));
                }}
                className="hover:text-blue-900 ml-0.5"
              >
                ×
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 ml-auto shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (showAddCustom) handleAddCustom();
                  else if (filtered.length === 1) toggle(filtered[0]);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
              }}
              placeholder="Search or type your own..."
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((option) => {
              const selected = value.includes(option);
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => toggle(option)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
                      selected && "bg-blue-50 text-blue-700 font-medium"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                        selected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    {option}
                  </button>
                </li>
              );
            })}

            {showAddCustom && (
              <li>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Add &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}

            {filtered.length === 0 && !showAddCustom && (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">
                No specialties found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
