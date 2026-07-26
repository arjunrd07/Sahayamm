"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const STAT_CARDS = [
  {
    id: "hackerone",
    logo: "hackerone",
    stat: "169",
    unit: "%",
    label: "return on investment",
    link: "/signup",
    badgeColor: "#0B3558",
    accentColor: "group-hover:border-[#0B3558]",
    buttonBg: "bg-[#0B3558] hover:bg-[#061e33] text-white",
    shapeSvg: (
      <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="8" width="24" height="24" rx="6" fill="#0B3558" />
        <circle cx="20" cy="20" r="6" fill="#FFFFFF" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "vonage",
    logo: "VONAGE",
    stat: "160",
    unit: "%",
    label: "increase in emergency relief reached",
    link: "/signup",
    badgeColor: "#006BFF",
    accentColor: "group-hover:border-[#006BFF]",
    buttonBg: "bg-[#006BFF] hover:bg-[#0052cc] text-white",
    shapeSvg: (
      <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
        <path d="M20 6L32 30H8L20 6Z" fill="#006BFF" />
      </svg>
    ),
  },
  {
    id: "texas",
    logo: "UT AUSTIN",
    stat: "20",
    unit: "%",
    label: "decrease in payroll processing errors",
    link: "/signup",
    badgeColor: "#FFA600",
    accentColor: "group-hover:border-[#FFA600]",
    buttonBg: "bg-[#FFA600] hover:bg-[#e09200] text-white",
    shapeSvg: (
      <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" fill="#FFA600" />
      </svg>
    ),
  },
  {
    id: "muckrack",
    logo: "MUCK RACK",
    stat: "8",
    unit: " days",
    label: "reduction in loan approval time",
    link: "/signup",
    badgeColor: "#BB32D5",
    accentColor: "group-hover:border-[#BB32D5]",
    buttonBg: "bg-[#BB32D5] hover:bg-[#9a24b3] text-white",
    shapeSvg: (
      <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="6" width="28" height="28" rx="14" fill="#BB32D5" />
        <path d="M14 14H26V26H14V14Z" fill="#FFFFFF" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "smithai",
    logo: "SMITH.AI",
    stat: "26",
    unit: "%",
    label: "increase in employee retention",
    link: "/signup",
    badgeColor: "#8247F5",
    accentColor: "group-hover:border-[#8247F5]",
    buttonBg: "bg-[#8247F5] hover:bg-[#682fd4] text-white",
    shapeSvg: (
      <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
        <path d="M20 4L34 18L20 32L6 18L20 4Z" fill="#8247F5" />
      </svg>
    ),
  },
];

export function CustomerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : STAT_CARDS.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < STAT_CARDS.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="py-24 px-6 sm:px-12 bg-white dark:bg-[#0B1528]">
      <div className="max-w-[1240px] mx-auto">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-16">
          <div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B3558] dark:text-white leading-[1.12]">
              Discover how businesses grow <br /> with Sahayam
            </h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0B3558] text-white text-sm font-extrabold hover:bg-[#061e33] transition-all shadow-md"
            >
              <span>View customer stories</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous story"
                className="h-11 w-11 rounded-full border border-[#D4E0ED] dark:border-surface-border-dark flex items-center justify-center text-[#476788] hover:border-[#006BFF] hover:text-[#006BFF] transition-all bg-white dark:bg-surface-dark shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next story"
                className="h-11 w-11 rounded-full border border-[#D4E0ED] dark:border-surface-border-dark flex items-center justify-center text-[#476788] hover:border-[#006BFF] hover:text-[#006BFF] transition-all bg-white dark:bg-surface-dark shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid / Carousel */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {STAT_CARDS.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative rounded-3xl p-7 flex flex-col justify-between min-h-[350px] cursor-pointer transition-all duration-300 border bg-gradient-to-b from-white to-[#F0F3F8] dark:from-[#111C33] dark:to-[#0B1528] group ${
                  isActive
                    ? "border-[#006BFF] shadow-[0_12px_32px_rgba(0,107,255,0.14)] -translate-y-1"
                    : "border-[#D4E0ED]/80 dark:border-surface-border-dark shadow-sm hover:border-[#006BFF]/50"
                }`}
              >
                <div>
                  {/* Company Logo Header */}
                  <span className="font-extrabold text-sm tracking-widest uppercase block text-[#0B3558] dark:text-white mb-8">
                    {item.logo}
                  </span>

                  {/* Huge Animated Number */}
                  <div className="flex items-baseline">
                    <span className="text-5xl sm:text-6xl font-black tracking-tight text-[#0B3558] dark:text-white">
                      {item.stat}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-[#006BFF] ml-0.5">
                      {item.unit}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#476788] dark:text-slate-300 mt-3 leading-snug">
                    {item.label}
                  </p>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 flex items-center justify-between">
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006BFF] hover:underline"
                  >
                    <span>Read now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* Geometric Shape Accent */}
                  <div className="opacity-80 group-hover:scale-110 transition-transform">
                    {item.shapeSvg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {STAT_CARDS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-8 bg-[#006BFF]"
                  : "w-2.5 bg-[#D4E0ED] dark:bg-slate-700 hover:bg-[#006BFF]/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
