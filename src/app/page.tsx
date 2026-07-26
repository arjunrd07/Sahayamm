import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { 
  ShieldCheck, 
  FileText, 
  Percent, 
  Bell, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Lock,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  Users,
  Check,
  Globe,
  Smartphone,
  ArrowUpRight,
  UserCheck,
  Shield,
  LayoutDashboard
} from "lucide-react";
import { CustomerCarousel } from "@/components/home/CustomerCarousel";
import { FeatureSwitchback } from "@/components/home/FeatureSwitchback";
import { HeroCalculator } from "@/components/home/HeroCalculator";
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
      : profile?.role === "admin"
      ? "/admin/dashboard"
      : "/customer/dashboard";

  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex flex-col font-sans selection:bg-signal-soft selection:text-signal">
      {/* 0. Top Interactive Evaluator Demo Banner */}
      <div className="bg-gradient-to-r from-black via-[#006bff] to-black text-white text-xs py-2 px-4 shadow-sm border-b border-signal/20">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wide text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
              Demo Switcher
            </span>
            <span>Test Sahayam roles out-of-the-box:</span>
          </div>

          <div className="flex items-center gap-2 font-bold">
            <Link
              href="/customer/dashboard"
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[11px] flex items-center gap-1"
            >
              <UserCheck className="h-3.5 w-3.5 text-cyan-300" />
              Customer
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[11px] flex items-center gap-1"
            >
              <Shield className="h-3.5 w-3.5 text-amber-300" />
              Admin
            </Link>
            <Link
              href="/superadmin/dashboard"
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[11px] flex items-center gap-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-emerald-300" />
              Superadmin
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-black/95 border-b border-slate-100 dark:border-surface-border-dark px-6 sm:px-12 py-4">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-signal flex items-center justify-center shadow-button transition-transform group-hover:scale-105">
              <span className="text-white text-lg font-black">S</span>
            </div>
            <span className="font-extrabold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-sm font-bold text-ink-slate">
            <a href="#features" className="hover:text-signal transition-colors">Features</a>
            <a href="#integrations" className="hover:text-signal transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-signal transition-colors">Pricing</a>
            <a href="#security" className="hover:text-signal transition-colors">Security</a>
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
              <span>Automated Intra-Organization Lending Platform</span>
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

              <Link
                href="/login"
                className="btn-secondary py-3.5 px-7 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 rounded-full transition-all whitespace-nowrap"
              >
                <span>Log in to workspace</span>
              </Link>
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


      {/* 4. Interactive Feature Switchback Section (Calendly Exact System) */}
      <FeatureSwitchback />

      {/* 5. "Connect Sahayam to the tools you already use" Integrations Grid */}
      <section id="integrations" className="py-24 px-6 sm:px-12 bg-slate-50/70 dark:bg-surface-dark/30 border-y border-slate-100 dark:border-surface-border-dark">
        <div className="max-w-[1240px] mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-ink dark:text-white">
            Connect Sahayam to the tools you already use
          </h2>
          <p className="text-ink-slate text-lg max-w-2xl mx-auto mb-16">
            Boost productivity with 100+ integrations across authentication, document signing, notifications, and finance engines.
          </p>

          {/* Icon Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
            {[
              { name: "DocuSeal", icon: FileText, color: "text-blue-500" },
              { name: "Supabase RLS", icon: Lock, color: "text-emerald-500" },
              { name: "Google", icon: Globe, color: "text-red-500" },
              { name: "Microsoft", icon: Building2, color: "text-blue-600" },
              { name: "Slack", icon: Bell, color: "text-purple-500" },
              { name: "Resend", icon: Zap, color: "text-amber-500" },
              { name: "PostgreSQL", icon: Layers, color: "text-cyan-600" },
              { name: "CSV Export", icon: FileSpreadsheet, color: "text-emerald-600" },
            ].map((tool) => (
              <div key={tool.name} className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm flex flex-col items-center justify-center gap-3 hover:border-signal transition-colors group">
                <tool.icon className={`h-7 w-7 ${tool.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-bold text-ink dark:text-white truncate">{tool.name}</span>
              </div>
            ))}
          </div>

          {/* Integration Suite Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="p-7 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-card hover:border-signal transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <svg className="h-7 w-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h4 className="font-extrabold text-xl text-ink dark:text-white">Google Workspace</h4>
              </div>
              <p className="text-sm text-ink-slate leading-relaxed mb-4">
                Get your work done faster by connecting Sahayam to Google Workspace, SSO authentication, and Google Drive attachments.
              </p>
              <span className="text-xs font-extrabold text-signal flex items-center gap-1">
                Learn more ↗
              </span>
            </div>

            <div className="p-7 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-card hover:border-signal transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <svg className="h-7 w-7" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H1z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H1z" />
                </svg>
                <h4 className="font-extrabold text-xl text-ink dark:text-white">Microsoft 365</h4>
              </div>
              <p className="text-sm text-ink-slate leading-relaxed mb-4">
                Make your day easier with Sahayam integrations for Microsoft Teams, Azure Active Directory SSO, and Outlook notifications.
              </p>
              <span className="text-xs font-extrabold text-signal flex items-center gap-1">
                Learn more ↗
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "More than a lending link" Feature Showcase */}
      <section className="py-24 px-6 sm:px-12 bg-white dark:bg-canvas-dark">
        <div className="max-w-[1240px] mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-ink dark:text-white">
            More than a lending link
          </h2>
          <p className="text-ink-slate text-lg max-w-2xl mx-auto mb-16">
            Sahayam&apos;s functionality goes way beyond a simple lending portal, with customizable, automated features to help teams achieve goals faster.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            {/* Left Mobile Access Card */}
            <div className="lg:col-span-6 relative">
              <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-surface-border-dark rounded-3xl p-6 shadow-elevated space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border-dark">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-signal/10 text-signal flex items-center justify-center font-bold">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-ink dark:text-white">Mobile Bottom Navigation</h4>
                      <p className="text-xs text-ink-slate">Instant thumb access for loan requests & notifications</p>
                    </div>
                  </div>
                  <span className="badge bg-signal-soft text-signal-cobalt font-bold text-xs">iOS & Android</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-surface-border-dark">
                  <div className="p-2 rounded-xl bg-signal text-white flex flex-col items-center gap-1 shadow-sm">
                    <Building2 className="h-4 w-4" />
                    <span className="text-[10px] font-extrabold">Home</span>
                  </div>
                  <div className="p-2 rounded-xl text-ink-slate flex flex-col items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Loans</span>
                  </div>
                  <div className="p-2 rounded-xl text-ink-slate flex flex-col items-center gap-1">
                    <Bell className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Alerts</span>
                  </div>
                  <div className="p-2 rounded-xl text-ink-slate flex flex-col items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Profile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Feature Highlights */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl border-2 border-signal bg-signal-soft/30 dark:bg-signal/10">
                <h4 className="font-extrabold text-lg text-ink dark:text-white">Mobile & Bottom Bar Accessibility</h4>
                <p className="text-sm text-ink-slate mt-1">Dedicated mobile bottom navigation for quick 1-thumb loan submissions on iOS & Android.</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-surface-border-dark hover:border-signal/40 bg-white dark:bg-surface-dark transition-all">
                <h4 className="font-extrabold text-lg text-ink dark:text-white">Automated reminders & email alerts</h4>
                <p className="text-sm text-ink-slate mt-1">Instant notifications for agreement signing links, approval milestones, and due dates.</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-surface-border-dark hover:border-signal/40 bg-white dark:bg-surface-dark transition-all">
                <h4 className="font-extrabold text-lg text-ink dark:text-white">Row Level Security (RLS) isolation</h4>
                <p className="text-sm text-ink-slate mt-1">Multi-tenant database policies guarantee total data separation across organizations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Cards */}
      <section id="pricing" className="py-24 px-6 sm:px-12 bg-slate-50/80 dark:bg-surface-dark/40 border-y border-slate-100 dark:border-surface-border-dark">
        <div className="max-w-[1240px] mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-ink dark:text-white">
            Pick the perfect plan for your team
          </h2>
          <p className="text-ink-slate text-lg max-w-xl mx-auto mb-10">
            Transparent pricing designed to scale with your organization&apos;s internal credit needs.
          </p>

          {/* Pricing Toggle Pill */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark mb-16 shadow-sm">
            <span className="px-4 py-2 rounded-full bg-signal text-white text-xs font-bold shadow-sm">Billed yearly</span>
            <span className="px-4 py-2 rounded-full text-xs font-bold text-ink-slate">Billed monthly</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">Save 16%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Free Card */}
            <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark">
              <div>
                <h3 className="font-extrabold text-xl text-ink dark:text-white">Free</h3>
                <p className="text-xs text-ink-slate mt-1 mb-6">For personal use.</p>
                <p className="text-3xl font-black text-ink dark:text-white mb-6">Always free</p>
                <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Up to 10 active loans</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Verification queue</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Standard CSV exports</li>
                </ul>
              </div>
              <Link href="/signup" className="btn-dark w-full text-sm font-bold text-center rounded-full py-3">
                Get started
              </Link>
            </div>

            {/* Standard Card */}
            <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark">
              <div>
                <h3 className="font-extrabold text-xl text-ink dark:text-white">Standard</h3>
                <p className="text-xs text-ink-slate mt-1 mb-6">For professionals and small teams.</p>
                <p className="text-4xl font-black text-ink dark:text-white mb-6">₹10 <span className="text-xs text-ink-slate font-normal">/ seat / mo</span></p>
                <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Up to 100 active loans</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> DocuSeal e-signatures</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Email notifications</li>
                </ul>
              </div>
              <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
                Get started
              </Link>
            </div>

            {/* Teams Card (Recommended) */}
            <div className="card p-7 flex flex-col justify-between border-2 border-signal relative shadow-elevated bg-white dark:bg-surface-dark">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-signal text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                Recommended plan
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-ink dark:text-white">Teams</h3>
                <p className="text-xs text-ink-slate mt-1 mb-6">For growing businesses.</p>
                <p className="text-4xl font-black text-ink dark:text-white mb-6">₹16 <span className="text-xs text-ink-slate font-normal">/ seat / mo</span></p>
                <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Unlimited loan requests</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Automated reminders</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Advanced audit reporting</li>
                </ul>
              </div>
              <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
                Try for free
              </Link>
            </div>

            {/* Enterprise Card */}
            <div className="card p-7 flex flex-col justify-between hover:border-signal transition-colors bg-white dark:bg-surface-dark">
              <div>
                <h3 className="font-extrabold text-xl text-ink dark:text-white">Enterprise</h3>
                <p className="text-xs text-ink-slate mt-1 mb-6">For large companies.</p>
                <p className="text-4xl font-black text-ink dark:text-white mb-6">Starts at ₹15k <span className="text-xs text-ink-slate font-normal">/ yr</span></p>
                <ul className="space-y-3 text-xs text-ink-slate font-semibold mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Custom SLA & support</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Dedicated Superadmin</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-signal" /> Custom DB isolation</li>
                </ul>
              </div>
              <Link href="/signup" className="btn-primary w-full text-sm font-bold text-center rounded-full shadow-button py-3">
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Interactive Customer Success Carousel Section (Calendly Exact System) */}
      <CustomerCarousel />

      {/* 9. Security Section */}
      <section id="security" className="py-24 px-6 sm:px-12 bg-slate-50/80 dark:bg-surface-dark/40 border-y border-slate-100 dark:border-surface-border-dark text-center">
        <div className="max-w-[1240px] mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-ink dark:text-white">
            Built to keep your organization secure
          </h2>
          <p className="text-ink-slate text-lg max-w-2xl mx-auto mb-16">
            Keep your lending data secure with enterprise-grade admin management, security integrations, data governance, compliance audits, and privacy protections.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
            {["AICPA SOC", "PCI DSS", "GDPR", "Security Lock", "STAR LEVEL ONE", "ISO 27001"].map((badge) => (
              <div key={badge} className="h-28 w-28 rounded-full bg-white dark:bg-surface-dark border-2 border-slate-200/90 dark:border-surface-border-dark shadow-sm flex flex-col items-center justify-center p-3 text-center hover:border-signal transition-colors">
                <ShieldCheck className="h-7 w-7 text-signal mb-1" />
                <span className="text-[11px] font-extrabold text-ink dark:text-white leading-tight">{badge}</span>
              </div>
            ))}
          </div>

          <Link href="#security" className="text-xs font-bold text-signal hover:underline">
            Learn more →
          </Link>
        </div>
      </section>

      {/* 10. Bottom CTA Banner */}
      <section className="py-24 px-6 sm:px-12 bg-white dark:bg-canvas-dark">
        <div className="max-w-[1240px] mx-auto bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark rounded-3xl p-10 sm:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-elevated">
          <div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink dark:text-white tracking-tight mb-2">
              Power up your lending
            </h2>
            <p className="text-ink-slate text-base">Get started in seconds — for free.</p>
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
