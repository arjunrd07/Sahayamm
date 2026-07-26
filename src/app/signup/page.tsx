"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Organization } from "@/types/database";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function SignupPage() {
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadOrgs() {
      try {
        const { data, error } = await supabase.from("organizations").select("*").order("name");
        if (!error && data) {
          setExistingOrgs(data as Organization[]);
        }
      } catch {
        // Ignore if table doesn't exist yet
      }
    }
    loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanOrgName = orgName.trim();
    if (!cleanOrgName) {
      push("error", "Enter your organization name to continue.");
      return;
    }
    if (!password || password.length < 6) {
      push("error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    let targetOrgId: string = DEFAULT_ORG_ID;

    // 1. Safe resolution of Organization ID
    try {
      const { data: foundOrgs, error: selectError } = await supabase
        .from("organizations")
        .select("id, name")
        .ilike("name", cleanOrgName)
        .limit(1);

      if (!selectError && foundOrgs && foundOrgs.length > 0) {
        targetOrgId = foundOrgs[0].id;
      } else {
        const generatedCode =
          cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, "") +
          "-" +
          Math.random().toString(36).substring(2, 6);

        const { data: newOrg, error: createOrgError } = await supabase
          .from("organizations")
          .insert({
            name: cleanOrgName,
            code: generatedCode,
          })
          .select("id")
          .maybeSingle();

        if (newOrg?.id) {
          targetOrgId = newOrg.id;
        }
      }
    } catch (dbErr) {
      console.warn("Using fallback org ID due to DB connection warning:", dbErr);
    }

    // 2. Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, org_id: targetOrgId, org_name: cleanOrgName },
      },
    });

    if (authError) {
      push("error", authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      try {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            org_id: targetOrgId,
            full_name: fullName,
            email: email,
            role: "customer",
            verification_status: "unverified",
          },
          { onConflict: "id" }
        );

        if (profileError && !profileError.message.includes("duplicate")) {
          console.warn("Profile creation warning:", profileError.message);
        }
      } catch {
        // Safe profile creation catch
      }

      push("success", "Account created successfully!");

      let userRole = "customer";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (profile?.role) {
          userRole = profile.role;
        }
      } catch {
        // Fallback default
      }

      setLoading(false);

      if (userRole === "superadmin") {
        router.push("/superadmin/dashboard");
      } else if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } else {
      setLoading(false);
      push("success", "Account created! You can now sign in.");
      router.push("/login");
    }
  }

  return (
    <AuthShell
      title="Create your free account"
      subtitle="No credit card required. Instant organization workspace setup."
    >
      {/* Social SSO Buttons matching Calendly hero image */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => push("info", "Google SSO is enabled in production Supabase environment.")}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-ink dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign up with Google
        </button>

        <button
          type="button"
          onClick={() => push("info", "Microsoft SSO is enabled in production Supabase environment.")}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-ink dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
        >
          <svg className="h-5 w-5" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Sign up with Microsoft
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-surface-border-dark"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-ink-slate uppercase">Or work email</span>
          <div className="flex-grow border-t border-slate-200 dark:border-surface-border-dark"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Organization Name" htmlFor="org_name">
          <Input
            id="org_name"
            required
            list="org-suggestions"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. TechCorp Inc., Acme Ltd."
          />
          {existingOrgs.length > 0 && (
            <datalist id="org-suggestions">
              {existingOrgs.map((org) => (
                <option key={org.id} value={org.name} />
              ))}
            </datalist>
          )}
        </Field>

        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
        </Field>

        <Field label="Work Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" variant="primary" className="w-full py-3.5 text-base font-bold rounded-full shadow-button" loading={loading}>
          Create Account
        </Button>
      </form>
      <p className="text-sm text-ink-slate text-center mt-6 font-semibold">
        Already have an account?{" "}
        <Link href="/login" className="text-signal font-bold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

