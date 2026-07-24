"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      push("error", error.message);
      return;
    }

    if (data.user) {
      push("success", "Signed in successfully!");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role === "superadmin" || profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    }
  }

  return (
    <AuthShell
      title="Log in to your account"
      subtitle="Enter your organization email and password to access your workspace."
    >
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

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" variant="primary" className="w-full py-3 text-base font-semibold" loading={loading}>
          Log In
        </Button>
      </form>

      <p className="text-sm text-ink-slate text-center mt-6">
        New to Sahayam?{" "}
        <Link href="/signup" className="text-signal font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
