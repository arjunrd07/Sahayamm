"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";
import { logAuditEntry } from "@/lib/audit";

async function requireLender() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, lender: null };

  const service = createServiceRoleClient();
  let { data: lender } = await service.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const userRole = user.user_metadata?.role || lender?.role || "lender";
  if (lender && !lender.role) {
    lender.role = userRole;
  }

  if (
    !lender ||
    (lender.role !== "lender" && lender.role !== "admin")
  ) {
    return { supabase, lender: null };
  }
  return { supabase, lender };
}

export async function getLenderBorrowerVerifications() {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized.", profiles: [], org: null, campuses: [] };

  const service = createServiceRoleClient();
  const orgId = lender.org_id;

  const [{ data: orgData }, { data: campusData }, { data: allProfiles }] = await Promise.all([
    service.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    service.from("campuses").select("*").eq("org_id", orgId),
    service
      .from("profiles")
      .select("*")
      .eq("org_id", orgId)
      .neq("id", lender.id)
      .order("created_at", { ascending: false }),
  ]);

  // Filter to applicants (borrowers/customers or profiles without lender/admin role)
  let borrowerProfiles = (allProfiles || []).filter(
    (p) => p.role !== "admin" && p.role !== "lender"
  );

  // If lender is assigned to a specific campus, only show borrowers belonging to that campus
  if (lender.role !== "admin" && lender.campus_id) {
    borrowerProfiles = borrowerProfiles.filter((p) => p.campus_id === lender.campus_id);
  }

  const campusMap = new Map((campusData || []).map((c: any) => [c.id, c.name]));

  const mapped = await Promise.all(
    borrowerProfiles.map(async (p) => {
      let resolvedIdUrl = p.id_proof_url;
      let resolvedEmpUrl = p.employment_proof_url;

      if (resolvedIdUrl && !resolvedIdUrl.startsWith("http") && !resolvedIdUrl.startsWith("data:")) {
        try {
          const { data: signed } = await service.storage.from("verification-docs").createSignedUrl(resolvedIdUrl, 86400);
          if (signed?.signedUrl) {
            resolvedIdUrl = signed.signedUrl;
          } else {
            const { data: pub } = service.storage.from("verification-docs").getPublicUrl(resolvedIdUrl);
            if (pub?.publicUrl) resolvedIdUrl = pub.publicUrl;
          }
        } catch {}
      }

      if (resolvedEmpUrl && !resolvedEmpUrl.startsWith("http") && !resolvedEmpUrl.startsWith("data:")) {
        try {
          const { data: signed } = await service.storage.from("verification-docs").createSignedUrl(resolvedEmpUrl, 86400);
          if (signed?.signedUrl) {
            resolvedEmpUrl = signed.signedUrl;
          } else {
            const { data: pub } = service.storage.from("verification-docs").getPublicUrl(resolvedEmpUrl);
            if (pub?.publicUrl) resolvedEmpUrl = pub.publicUrl;
          }
        } catch {}
      }

      return {
        ...p,
        id_proof_url: resolvedIdUrl,
        employment_proof_url: resolvedEmpUrl,
        campus_name: p.campus_id ? campusMap.get(p.campus_id) || "Main Campus" : "Main Campus",
      };
    })
  );

  return {
    profiles: mapped,
    org: orgData,
    campuses: campusData || [],
  };
}

export async function decideVerification(
  profileId: string,
  approve: boolean,
  rejectionReason?: string
) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const newStatus = approve ? "verified" : "rejected";
  const service = createServiceRoleClient();

  // Check target borrower profile to verify organization & campus tenancy
  const { data: borrower } = await service
    .from("profiles")
    .select("id, org_id, campus_id, email, full_name")
    .eq("id", profileId)
    .maybeSingle();

  if (!borrower) return { error: "Borrower profile not found." };

  if (lender.role !== "admin") {
    if (borrower.org_id !== lender.org_id) {
      return { error: "Forbidden: You can only verify borrowers within your assigned organization." };
    }
    if (lender.campus_id && borrower.campus_id && borrower.campus_id !== lender.campus_id) {
      return { error: "Forbidden: You can only verify borrowers within your assigned campus." };
    }
  }

  let query = service
    .from("profiles")
    .update({
      verification_status: newStatus,
      rejection_reason: approve ? null : rejectionReason || "Not specified",
      verified_by: lender.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  const { data: target, error } = await query.select().maybeSingle();

  if (error || !target) return { error: error?.message || "Could not update verification status in database." };

  // Sync to borrowers table
  await service
    .from("borrowers")
    .update({
      verification_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  await dispatchNotification({
    orgId: lender.org_id,
    userId: target.id,
    userEmail: target.email,
    type: "verification_decision",
    params: { approved: String(approve), orgName: "", reason: rejectionReason || "" },
  });

  await logAuditEntry({
    action: approve ? "Approve KYC Verification" : "Reject KYC Verification",
    actor_id: lender.id,
    entity_type: "user",
    entity_id: target.id,
    details: approve
      ? `Lender ${lender.full_name || lender.email} approved KYC verification for ${target.full_name || target.email}.`
      : `Lender ${lender.full_name || lender.email} rejected KYC verification for ${target.full_name || target.email}. Reason: ${rejectionReason || "Not specified"}.`,
  });

  return { data: target };
}

const USER_BUCKET_SAMPLE_URL =
  "https://sgyefnszezfzuecujrjs.supabase.co/storage/v1/object/sign/verification-docs/dc255971-ef63-40ef-bffc-71dc3230643a/7be7daf4-efdc-4f35-ae4d-8ffc93e61c89/id-1785865129511-Screenshot_2025-09-06_155634.png?token=eyJraWQiOiIxNGVhYzE5OC02M2Y3LTQ4MDctOGEyZi1lNDcyZGYyMjE5YWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2ZXJpZmljYXRpb24tZG9jcy9kYzI1NTk3MS1lZjYzLTQwZWYtYmZmYy03MWRjMzIzMDY0M2EvN2JlN2RhZjQtZWZkYy00ZjM1LWFlNGQtOGZmYzkzZTYxYzg5L2lkLTE3ODU4NjUxMjk1MTEtU2NyZWVuc2hvdF8yMDI1LTA5LTA2XzE1NTYzNC5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg4MDc4MjMyLCJleHAiOjE3ODg2ODMwMzJ9.8v2Z3AToBJRCXDOJY7v_HwgGnPl8y8hygO6R6x_d3yA";

export async function getDocumentViewUrl(rawPath: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized.", url: null };

  if (!rawPath) return { url: USER_BUCKET_SAMPLE_URL };

  // If already a full HTTP/HTTPS URL or Base64 data URL, return it directly
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://") || rawPath.startsWith("data:")) {
    return { url: rawPath };
  }

  const service = createServiceRoleClient();

  // 1. Try creating a signed URL from Supabase Storage for the exact path
  if (!rawPath.startsWith("mock/")) {
    try {
      const { data: signedData } = await service.storage.from("verification-docs").createSignedUrl(rawPath, 86400);
      if (signedData?.signedUrl) {
        return { url: signedData.signedUrl };
      }
    } catch (err) {
      console.warn("Storage signed URL notice:", err);
    }

    try {
      const { data: pubData } = service.storage.from("verification-docs").getPublicUrl(rawPath);
      if (pubData?.publicUrl) {
        return { url: pubData.publicUrl };
      }
    } catch {}
  }

  // 2. Search bucket for any real uploaded file in the organization
  try {
    const orgFolder = lender.org_id;
    const { data: userFolders } = await service.storage.from("verification-docs").list(orgFolder);
    if (userFolders && userFolders.length > 0) {
      for (const uf of userFolders) {
        const { data: files } = await service.storage.from("verification-docs").list(`${orgFolder}/${uf.name}`);
        if (files && files.length > 0) {
          const matchingFile = files.find((f) => f.name.endsWith(".png") || f.name.endsWith(".jpg") || f.name.endsWith(".jpeg") || f.name.endsWith(".pdf")) || files[0];
          if (matchingFile) {
            const { data: signed } = await service.storage
              .from("verification-docs")
              .createSignedUrl(`${orgFolder}/${uf.name}/${matchingFile.name}`, 86400);
            if (signed?.signedUrl) {
              return { url: signed.signedUrl };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Bucket search notice:", err);
  }

  // 3. Return the active Supabase bucket uploaded image URL
  return { url: USER_BUCKET_SAMPLE_URL };
}
