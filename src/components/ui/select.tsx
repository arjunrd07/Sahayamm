"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Select option...",
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-canvas-dark px-3.5 py-2.5 text-sm font-medium text-ink dark:text-white shadow-xs transition-all",
          "hover:border-signal/50 focus:outline-none focus:ring-2 focus:ring-signal",
          isOpen && "ring-2 ring-signal border-signal"
        )}
      >
        <span className={selectedOption ? "font-semibold" : "text-slate-400 font-normal"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-signal")} />
      </button>

      {/* Popover Options List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark p-1.5 shadow-elevated animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
                    isSelected
                      ? "bg-signal-soft text-signal"
                      : "text-ink dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-signal" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
