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
  Lock 
} from "lucide-react";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role, full_name, email").eq("id", user.id).maybeSingle();
    profile = data;
  }

  const dashboardUrl = profile?.role === "superadmin" || profile?.role === "admin" ? "/admin/dashboard" : "/customer/dashboard";

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-white flex flex-col selection:bg-signal-soft selection:text-signal">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-canvas-dark/90 border-b border-surface-border dark:border-surface-border-dark px-6 sm:px-12 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-signal flex items-center justify-center shadow-button">
              <span className="text-white text-base font-bold">S</span>
            </div>
            <span className="font-bold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-ink-slate">
            <a href="#features" className="hover:text-ink dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-ink dark:hover:text-white transition-colors">How It Works</a>
            <a href="#security" className="hover:text-ink dark:hover:text-white transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href={dashboardUrl} className="btn-primary text-sm flex items-center gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm font-semibold">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary text-sm font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-20 px-6 sm:px-12 overflow-hidden">
        {/* Decorative Cyan and Magenta accent blobs behind Hero */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-accent-cyan/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-36 right-1/4 w-[450px] h-[300px] bg-accent-magenta/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-soft text-signal-cobalt text-xs font-semibold mb-6 border border-signal/15">
            <Building2 className="h-4 w-4" />
            <span>Intra-Organization Lending Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-[68px] font-bold tracking-tight leading-[1.12] mb-6 text-ink dark:text-white max-w-4xl mx-auto">
            Transparent Internal Lending for <span className="text-signal">Modern Teams</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-ink-slate max-w-2xl mx-auto leading-relaxed mb-10">
            Empower employees and members with organized, record-kept internal loans. Verification, loan requests, digital agreement signing, and automated notifications — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            {user ? (
              <Link href={dashboardUrl} className="btn-primary px-8 py-3.5 text-lg font-semibold w-full sm:w-auto">
                Access Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-primary px-8 py-3.5 text-lg font-semibold w-full sm:w-auto">
                  Create Free Account
                </Link>
                <Link href="/login" className="btn-dark px-8 py-3.5 text-lg font-semibold w-full sm:w-auto">
                  Sign In to Org
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-ink-slate font-semibold">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-signal" /> No cash handling</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-signal" /> DocuSeal digital signatures</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-signal" /> Superadmin verified access</span>
          </div>
        </div>

        {/* Hero Product Card backed by decorative blob */}
        <div className="relative max-w-[1000px] mx-auto mt-16">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent-cyan/20 to-accent-magenta/20 rounded-[32px] blur-2xl -z-10" />
          <div className="card p-8 sm:p-10 shadow-elevated border border-surface-border dark:border-surface-border-dark">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-surface-border dark:border-surface-border-dark">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-signal-soft text-signal flex items-center justify-center font-bold text-lg">
                  SL
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-base text-ink dark:text-white">Emergency Expense Loan</h4>
                  <p className="text-xs text-ink-slate mt-0.5">Requested by Alex Rivera • TechCorp Inc.</p>
                </div>
              </div>
              <span className="badge bg-emerald-50 text-emerald-700 font-semibold text-xs">Active Loan</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-lg bg-surface-pebble dark:bg-surface-dark">
                <p className="text-xs font-semibold text-ink-slate mb-1">Loan Amount</p>
                <p className="text-xl font-bold text-ink dark:text-white">₹50,000</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-pebble dark:bg-surface-dark">
                <p className="text-xs font-semibold text-ink-slate mb-1">Duration</p>
                <p className="text-xl font-bold text-ink dark:text-white">90 Days</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-pebble dark:bg-surface-dark">
                <p className="text-xs font-semibold text-ink-slate mb-1">Agreement</p>
                <p className="text-xs sm:text-sm font-semibold text-signal flex items-center gap-1.5 mt-1">
                  <FileText className="h-4 w-4" /> Signed via DocuSeal
                </p>
              </div>
              <div className="p-4 rounded-lg bg-surface-pebble dark:bg-surface-dark">
                <p className="text-xs font-semibold text-ink-slate mb-1">Status</p>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="h-4 w-4" /> Repayment Scheduled
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 sm:px-12 bg-white dark:bg-surface-dark/50 border-y border-surface-border dark:border-surface-border-dark">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-ink dark:text-white">Everything Your Org Needs for Internal Lending</h2>
            <p className="text-ink-slate text-base sm:text-lg">Replace informal, undocumented lending with clear records, verified identity, and digital signatures.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-signal-soft text-signal flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">Member Verification</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                Require ID proof and employment verification before loan eligibility. Admins review and approve member status.
              </p>
            </div>

            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">DocuSeal Integration</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                Generate legally structured loan agreements. Both borrower and org admin sign digitally with audit trails.
              </p>
            </div>

            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6">
                <Percent className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">Simple Interest Math</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                Calculates simple interest accurately based on term duration. No hidden fees or compounding interest traps.
              </p>
            </div>

            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-signal-soft text-signal flex items-center justify-center mb-6">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">Automated Notifications</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                In-app alerts and Resend email notifications keep borrowers and admins updated at every stage of the loan lifecycle.
              </p>
            </div>

            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">CSV Financial Reports</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                Export complete loan balances, repayments, and history to CSV for org accounting and audit compliance.
              </p>
            </div>

            <div className="card p-8">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink dark:text-white">Superadmin & RLS Security</h3>
              <p className="text-sm text-ink-slate leading-relaxed">
                Built on Supabase Row Level Security. All documents and records are protected, with full oversight for superadmins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 sm:px-12">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-ink dark:text-white">How Sahayam Works</h2>
            <p className="text-ink-slate text-base sm:text-lg">Simple 3-step process for employees and organization administrators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-signal text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-button">
                1
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink dark:text-white">Join Your Organization</h4>
              <p className="text-sm text-ink-slate leading-relaxed">
                Create an account choosing your organization. The first employee automatically becomes the Superadmin.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-signal text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-button">
                2
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink dark:text-white">Submit Loan Request</h4>
              <p className="text-sm text-ink-slate leading-relaxed">
                Enter amount, purpose, and duration. Admins review terms, calculate interest, and generate DocuSeal agreements.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-signal text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-button">
                3
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink dark:text-white">Sign & Track Repayment</h4>
              <p className="text-sm text-ink-slate leading-relaxed">
                Sign digitally via DocuSeal. Disbursal and repayments happen seamlessly with stored proof documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border dark:border-surface-border-dark py-12 px-6 sm:px-12 bg-canvas dark:bg-canvas-dark">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-signal flex items-center justify-center shadow-button">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="font-bold text-xl text-ink dark:text-white tracking-tight">Sahayam</span>
          </div>

          <p className="text-xs text-ink-slate">
            © {new Date().getFullYear()} Sahayam Platform. Built for intra-organization transparency.
          </p>

          <div className="flex items-center gap-6 text-sm text-ink-slate font-semibold">
            <Link href="/login" className="hover:text-ink dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-ink dark:hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
