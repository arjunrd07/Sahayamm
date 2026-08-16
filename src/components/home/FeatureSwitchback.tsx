"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  FileText, 
  Percent, 
  Calendar, 
  ArrowUpRight, 
  Building2
} from "lucide-react";

const SWITCHBACK_ITEMS = [
  {
    id: "connect",
    title: "Connect your organization & HRMS",
    description: "Sahayam syncs directly with your HRMS database, Google Workspace Directory, and Microsoft 365 to verify employee credit pools automatically.",
    badgeBg: "bg-[#E6F0FF] text-[#006BFF]",
    icon: Building2,
  },
  {
    id: "availability",
    title: "Add loan availability & interest policies",
    description: "Keep employees informed of available pool funds. Take full control of lending limits, 0% interest policies, and approval thresholds.",
    badgeBg: "bg-[#F3EBFD] text-[#8247F5]",
    icon: Percent,
  },
  {
    id: "agreements",
    title: "Instant Digital Agreement E-Signatures",
    description: "Sync e-signature agreements automatically. Every loan includes legally binding digital signatures with timestamped compliance audit logs.",
    badgeBg: "bg-[#FDF0FF] text-[#BB32D5]",
    icon: FileText,
  },
  {
    id: "event_types",
    title: "Customize your loan event types",
    description: "Configure One-on-One Emergency Advances, Department Pooled Funds, and Round-Robin Approval queues with automated payroll deduction.",
    badgeBg: "bg-[#FFF8E6] text-[#FFA600]",
    icon: Calendar,
  },
  {
    id: "share",
    title: "Share your loan request link",
    description: "Easily request emergency funds by sharing customized application links directly with your organization admins for instant approval.",
    badgeBg: "bg-[#EBF3FF] text-[#004EBA]",
    icon: ArrowUpRight,
  },
];

export function FeatureSwitchback() {
  return (
    <section id="features" className="py-24 px-6 sm:px-12 bg-white dark:bg-black">
      <div className="max-w-[1240px] mx-auto">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B3558] dark:text-white leading-[1.12]">
            Sahayam makes lending simple
          </h2>
          <p className="text-[#476788] dark:text-slate-300 text-lg leading-relaxed">
            Sahayam is easy enough for individual employees, and powerful enough to meet the needs of enterprise organizations — including 86% of leading companies.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#006BFF] text-white font-extrabold text-sm hover:bg-[#0052cc] transition-all shadow-[0_4px_20px_rgba(0,107,255,0.25)]"
            >
              <span>Sign up for free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SWITCHBACK_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-7 rounded-3xl bg-[#F4F8FF]/60 dark:bg-surface-dark/40 border border-[#D4E0ED]/60 dark:border-surface-border-dark hover:border-[#006BFF]/40 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.badgeBg} group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-xl text-[#0B3558] dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#476788] dark:text-slate-300 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
