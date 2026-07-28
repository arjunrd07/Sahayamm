"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const SAHAYAM_STORIES = [
  {
    id: "acme-corp",
    logo: "ACME CORP",
    stat: "100",
    unit: "%",
    label: "0% interest internal emergency loans disbursed for workforce",
    link: "/signup",
    brandColor: "#0B3558",
  },
  {
    id: "techflow",
    logo: "TECHFLOW",
    stat: "85",
    unit: "%",
    label: "faster loan request approval & instant bank disbursal",
    link: "/signup",
    brandColor: "#006BFF",
  },
  {
    id: "greenline",
    logo: "GREENLINE",
    stat: "99.4",
    unit: "%",
    label: "on-time automated salary repayment rate across pools",
    link: "/signup",
    brandColor: "#10B981",
  },
  {
    id: "apex-systems",
    logo: "APEX SYSTEMS",
    stat: "4.2",
    unit: "x",
    label: "increase in employee financial wellness & trust rating",
    link: "/signup",
    brandColor: "#FFA600",
  },
  {
    id: "nexus-health",
    logo: "NEXUS HEALTH",
    stat: "< 24",
    unit: " hrs",
    label: "average turnaround for medical emergency funds",
    link: "/signup",
    brandColor: "#8247F5",
  },
];

export function CustomerCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToCard = (index: number) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      const cardWidth = 280; // card width + gap
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      });
    }
  };

  const handlePrev = () => {
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : SAHAYAM_STORIES.length - 1;
    scrollToCard(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex < SAHAYAM_STORIES.length - 1 ? activeIndex + 1 : 0;
    scrollToCard(nextIdx);
  };

  return (
    <section className="py-20 px-6 sm:px-12 bg-white dark:bg-canvas-dark border-y border-slate-200/80 dark:border-surface-border-dark overflow-hidden">
      <div className="max-w-[1240px] mx-auto">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-ink dark:text-white leading-tight">
              Discover how businesses grow <br className="hidden sm:inline" /> with Sahayam
            </h2>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {/* Navigation Arrow Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous story"
                className="h-10 w-10 rounded-full border border-slate-200 dark:border-surface-border-dark flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-signal hover:text-signal transition-colors bg-white dark:bg-surface-dark shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next story"
                className="h-10 w-10 rounded-full border border-slate-200 dark:border-surface-border-dark flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-signal hover:text-signal transition-colors bg-white dark:bg-surface-dark shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Container with Snapping Cards */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 -mx-2 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {SAHAYAM_STORIES.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                onClick={() => scrollToCard(idx)}
                style={{
                  borderColor: isActive ? item.brandColor : "rgba(226, 232, 240, 0.9)",
                }}
                className={`flex-none w-[270px] sm:w-[300px] snap-start relative overflow-hidden rounded-[32px] pt-8 px-7 pb-0 flex flex-col justify-between min-h-[380px] cursor-pointer transition-all duration-200 border bg-[#f8f9fb] dark:bg-surface-dark group ${
                  isActive ? "shadow-card ring-1" : "hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Organization Logo Header */}
                  <div className="h-10 flex items-center mb-8">
                    <span className="font-black text-xl tracking-tight text-ink dark:text-white">
                      {item.logo}
                    </span>
                  </div>

                  {/* Giant Sahayam Impact Metric */}
                  <div className="flex items-baseline mb-2">
                    <span
                      className="text-5xl sm:text-6xl font-black tracking-tight"
                      style={{ color: item.brandColor }}
                    >
                      {item.stat}
                    </span>
                    <span
                      className="text-3xl font-black ml-0.5"
                      style={{ color: item.brandColor }}
                    >
                      {item.unit}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    {item.label}
                  </p>
                </div>

                {/* Bottom Organic Blob Shape with "Read now →" inside */}
                <div className="-mx-7 mt-8 relative">
                  <div
                    className="pt-6 pb-6 px-7 rounded-tr-[52px] rounded-bl-[32px] flex items-center gap-2 text-white font-bold text-sm transition-transform duration-200 group-hover:brightness-110"
                    style={{ backgroundColor: item.brandColor }}
                  >
                    <span>Read story</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {SAHAYAM_STORIES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCard(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-8 bg-signal"
                  : "w-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-signal/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
