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

      if (userRole === "superadmin" || userRole === "admin") {
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

        <Button type="submit" variant="primary" className="w-full py-3 text-base font-semibold" loading={loading}>
          Create Account
        </Button>
      </form>
      <p className="text-sm text-ink-slate text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-signal font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
