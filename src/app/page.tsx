import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Percent,
  ArrowRight,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  Check,
  ArrowUpRight,
  UserCheck,
  Shield,
  LayoutDashboard
} from "lucide-react";
import { FeatureSwitchback } from "@/components/home/FeatureSwitchback";
import { HeroCalculator } from "@/components/home/HeroCalculator";
import { LenderWorkingDemo } from "@/components/home/LenderWorkingDemo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role, full_name, email").eq("id", user.id).maybeSingle();
    profile = data;
  }

  const dashboardUrl =
    profile?.role === "superadmin"
      ? "/superadmin/dashboard"
      : profile?.role === "lender" || profile?.role === "admin"
      ? "/lender/dashboard"
      : "/borrower/dashboard";

  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex flex-col font-sans selection:bg-signal-soft selection:text-signal">
      {/* 0. Top Interactive Evaluator Demo Banner - Classic White & Blue Theme */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-blue-900/50 shadow-sm">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wide text-[11px] bg-blue-600/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
              Demo Switcher
            </span>
            <span className="text-slate-300">Test Sahayam roles out-of-the-box:</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <Link
              href="/borrower/dashboard"
              className="px-3 py-1 bg-white text-slate-900 hover:bg-blue-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Borrower
            </Link>
            <Link
              href="/lender/dashboard"
              className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-blue-200" /> Lender
            </Link>
            <Link
              href="/superadmin/dashboard"
              className="px-3 py-1 bg-slate-800 text-slate-100 hover:bg-slate-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" /> Superadmin
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white dark:bg-canvas-dark border-b border-slate-200 dark:border-surface-border-dark px-6 sm:px-12 py-4">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-signal flex items-center justify-center shadow-button transition-transform group-hover:scale-105">
              <span className="text-white text-lg font-black">S</span>
            </div>
            <span className="font-extrabold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-sm font-bold text-ink-slate">
            <a href="#features" className="hover:text-signal transition-colors">Features</a>
            <a href="#lender-demo" className="hover:text-signal transition-colors">Lender Working Demo</a>
            <a href="#integrations" className="hover:text-signal transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-signal transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href={dashboardUrl} className="btn-primary text-sm font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-button">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm font-bold px-4 py-2">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary text-sm font-bold px-6 py-2.5 rounded-full shadow-button">
                  Get started for free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-24 px-6 sm:px-12 bg-white dark:bg-canvas-dark overflow-hidden">
        {/* Soft Background Radial Blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Headline */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-soft text-signal-cobalt text-xs font-bold border border-signal/20 shadow-sm">
              <Building2 className="h-4 w-4 text-signal" />
              <span>Digital Loan Agreement Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-extrabold tracking-tight leading-[1.08] text-ink dark:text-white">
              Intra-org lending <br className="hidden sm:inline" />
              <span className="text-signal">made effortless</span>
            </h1>

            <p className="text-lg sm:text-xl text-ink-slate leading-relaxed max-w-xl">
              Empower your team with 0% interest emergency credit pools, legally binding DocuSeal digital agreements, and automated HRMS workflow approvals.
            </p>

            {/* Direct CTA Action Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 max-w-xl">
              <Link
                href="/signup"
                className="btn-primary py-3.5 px-7 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 rounded-full shadow-button hover:shadow-lg transition-all whitespace-nowrap"
              >
                <span>Get started for free</span>
                <ArrowRight className="h-5 w-5 shrink-0" />
              </Link>

              <a
                href="#lender-demo"
                className="btn-secondary py-3.5 px-7 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 rounded-full transition-all whitespace-nowrap"
              >
                <span>Try Lender Working Demo</span>
              </a>
            </div>

            <p className="text-xs text-ink-slate font-medium">
              Multi-tenant RLS isolation • DocuSeal e-signatures • Resend notifications
            </p>
          </div>

          {/* Right Hero Widget: Interactive Live Loan Calculator */}
          <div className="lg:col-span-6">
            <HeroCalculator />
          </div>
        </div>
      </section>

      {/* 3. Interactive Feature Switchback Section */}
      <FeatureSwitchback />

      {/* 4. Interactive Lender Working Demo Section */}
      <LenderWorkingDemo />

      {/* 10. Bottom CTA Banner */}
      <section className="py-24 px-6 sm:px-12 bg-white dark:bg-canvas-dark">
        <div className="max-w-[1240px] mx-auto bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark rounded-3xl p-10 sm:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-elevated">
          <div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink dark:text-white tracking-tight mb-2">
              Power up your lending
            </h2>
            <p className="text-ink-slate text-base">Get started in seconds for free.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link href="/signup" className="btn-primary py-4 px-8 text-base font-bold rounded-full shadow-button w-full sm:w-auto">
              Start for free
            </Link>
            <Link href="/login" className="btn-secondary py-4 px-8 text-base font-bold rounded-full w-full sm:w-auto">
              Get a demo
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Multi-Column Footer */}
      <footer className="mt-auto border-t border-slate-100 dark:border-surface-border-dark py-16 px-6 sm:px-12 bg-slate-50/60 dark:bg-canvas-dark text-ink-slate">
        <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-signal flex items-center justify-center shadow-button">
                <span className="text-white text-base font-black">S</span>
              </div>
              <span className="font-extrabold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-ink-slate">
              Empowering organizations with transparent, organized, interest-free employee credit pools and digital agreement workflows.
            </p>
          </div>

          <div>
            <h5 className="font-extrabold text-sm text-ink dark:text-white mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><a href="#features" className="hover:text-signal transition-colors">Features</a></li>
              <li><a href="#integrations" className="hover:text-signal transition-colors">Integrations</a></li>
              <li><a href="#pricing" className="hover:text-signal transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-sm text-ink dark:text-white mb-4">Solutions</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link href="/signup" className="hover:text-signal transition-colors">For Enterprises</Link></li>
              <li><Link href="/signup" className="hover:text-signal transition-colors">For Startups</Link></li>
              <li><Link href="/signup" className="hover:text-signal transition-colors">DocuSeal Integration</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-extrabold text-sm text-ink dark:text-white mb-4">Account</h5>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><Link href="/login" className="hover:text-signal transition-colors">Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-signal transition-colors">Create Account</Link></li>
              <li><Link href={dashboardUrl} className="hover:text-signal transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto pt-8 border-t border-slate-200/80 dark:border-surface-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <p>© {new Date().getFullYear()} Sahayam Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-signal">Privacy Policy</a>
            <a href="#" className="hover:text-signal">Terms of Service</a>
            <a href="#" className="hover:text-signal">Security Overview</a>
          </div>
        </div>
      </footer>
    </div>
  );
}