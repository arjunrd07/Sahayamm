"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly");

  const prices = {
    growth: billingCycle === "yearly" ? "₹2,499" : "₹2,999",
    enterprise: billingCycle === "yearly" ? "₹9,999" : "₹11,999",
    subtext: billingCycle === "yearly" ? "/ mo (billed annually)" : "/ mo (billed monthly)",
  };

  return (
    <section id="pricing" className="py-24 px-6 sm:px-12 bg-slate-50/80 dark:bg-surface-dark/40 border-y border-slate-100 dark:border-surface-border-dark">
      <div className="max-w-[1240px] mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-ink dark:text-white">
          Pick the perfect plan for your team
        </h2>
        <p className="text-ink-slate text-lg max-w-xl mx-auto mb-10">
          Transparent pricing designed to scale with your organization&apos;s internal liquidity &amp; credit needs.
        </p>

        {/* Interactive Pricing Toggle Pill */}
        <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark mb-16 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              billingCycle === "yearly"
                ? "bg-signal text-white shadow-sm"
                : "text-ink-slate hover:text-ink dark:hover:text-white"
            }`}
          >
            Billed yearly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-signal text-white shadow-sm"
                : "text-ink-slate hover:text-ink dark:hover:text-white"
            }`}
          >
            Billed monthly
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-800/40">
            Save 20%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Starter Plan */}
          <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark">
            <div>
              <h3 className="font-extrabold text-xl text-ink dark:text-white">Starter</h3>
              <p className="text-xs text-ink-slate mt-1 mb-6">For small teams &amp; startups (Up to 25 members).</p>
              <p className="text-3xl font-black text-ink dark:text-white mb-6">
                ₹0 <span className="text-xs text-ink-slate font-semibold">/ month</span>
              </p>
              <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Up to 25 employee accounts</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> 0% interest internal emergency loans</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Automated agreement PDF generation</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Basic verification queue &amp; email alerts</li>
              </ul>
            </div>
            <Link href="/signup" className="btn-dark w-full text-sm font-bold text-center rounded-full py-3">
              Get started for free
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark">
            <div>
              <h3 className="font-extrabold text-xl text-ink dark:text-white">Growth</h3>
              <p className="text-xs text-ink-slate mt-1 mb-6">For growing mid-sized organizations.</p>
              <p className="text-4xl font-black text-ink dark:text-white mb-1">
                {prices.growth}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mb-6">{prices.subtext}</p>
              <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Up to 250 active employees</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Native digital e-signatures &amp; agreement vault</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Automated repayment due reminders</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Custom capital pool limit controls</li>
              </ul>
            </div>
            <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
              Start Growth Plan
            </Link>
          </div>

          {/* Enterprise Plan (Recommended) */}
          <div className="card p-7 flex flex-col justify-between border-2 border-signal relative shadow-elevated bg-white dark:bg-surface-dark">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-signal text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              Recommended for Enterprise
            </span>
            <div>
              <h3 className="font-extrabold text-xl text-ink dark:text-white">Enterprise</h3>
              <p className="text-xs text-ink-slate mt-1 mb-6">For large corporations &amp; workforce pools.</p>
              <p className="text-4xl font-black text-ink dark:text-white mb-1">
                {prices.enterprise}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mb-6">{prices.subtext}</p>
              <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Unlimited employees &amp; liquidity pools</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Admin &amp; Lender multi-tenant oversight</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Dedicated database isolation &amp; RLS audit</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Priority SLA &amp; instant CIBIL scoring</li>
              </ul>
            </div>
            <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
              Start Enterprise Plan
            </Link>
          </div>

          {/* Custom Vault Plan */}
          <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark">
            <div>
              <h3 className="font-extrabold text-xl text-ink dark:text-white">Custom Vault</h3>
              <p className="text-xs text-ink-slate mt-1 mb-6">For financial institutions &amp; NBFC partners.</p>
              <p className="text-3xl font-black text-ink dark:text-white mb-6">Custom Pricing</p>
              <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Custom bank API &amp; gateway integration</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Multi-stage lender approval workflows</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Dedicated Account Manager &amp; 24/7 support</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal shrink-0" /> Custom webhook triggers &amp; compliance logs</li>
              </ul>
            </div>
            <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
