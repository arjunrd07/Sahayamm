"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/status-badge";
import { initials } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";

export default function CustomerProfilePage() {
  const { profile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .single()
      .then(({ data }) => setOrg(data as Organization));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.org_id]);

  if (!profile) return null;

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-accent-soft text-accent flex items-center justify-center text-lg font-semibold">
            {initials(profile.full_name)}
          </div>
          <div>
            <p className="font-semibold">{profile.full_name}</p>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">Details</CardTitle>
        <div className="space-y-3 text-sm">
          <Row label="Organization" value={org?.name ?? "—"} />
          <Row label="Phone" value={profile.phone || "—"} />
          <Row label="Role" value="Customer" />
          <div className="flex items-center justify-between">
            <span className="text-muted">Verification status</span>
            <VerificationBadge status={profile.verification_status} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
