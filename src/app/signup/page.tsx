"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Organization } from "@/types/database";
import { MailCheck } from "lucide-react";

export default function SignupPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("organizations")
      .select("*")
      .order("name")
      .then(({ data }) => setOrgs((data as Organization[]) || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) {
      push("error", "Select your organization to continue.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName, phone, org_id: orgId },
      },
    });
    setLoading(false);
    if (error) {
      push("error", error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="One more step">
        <div className="flex flex-col items-center text-center py-4">
          <MailCheck className="h-8 w-8 text-accent mb-3" />
          <p className="text-sm text-muted">
            We sent a confirmation link to <span className="font-medium text-ink dark:text-white">{email}</span>.
            Open it to activate your account and start verification.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Join your organization's internal lending platform.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Organization" htmlFor="org">
          <Select id="org" required value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Select your organization</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Continue
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
