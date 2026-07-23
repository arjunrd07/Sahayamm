"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MailCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
            We sent a sign-in link to <span className="font-medium text-ink dark:text-white">{email}</span>.
            Open it on this device to continue.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="We'll email you a one-time sign-in link — no password needed.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Work or organization email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Send sign-in link
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        New to Sahayam?{" "}
        <Link href="/signup" className="text-accent font-medium">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
