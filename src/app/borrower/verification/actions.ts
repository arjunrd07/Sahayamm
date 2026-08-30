"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function submitBorrowerVerificationDocuments(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to submit verification documents." };
  }

  const idFile = formData.get("idProof") as File | null;
  const empFile = formData.get("employmentProof") as File | null;

  if (!idFile || !empFile) {
    return { error: "Please provide both PAN Card and Pay Slip files." };
  }

  const service = createServiceRoleClient();

  // Get user profile
  const { data: profile } = await service
    .from("profiles")
    .select("id, org_id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { error: "Profile not found. Please complete your registration." };
  }

  // Ensure storage bucket exists
  try {
    await service.storage.createBucket("verification-docs", { public: true });
  } catch {}

  let idUrl = "";
  let empUrl = "";

  // Upload PAN Card
  try {
    const idPath = `${profile.org_id}/${profile.id}/pan-${Date.now()}-${idFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const idBytes = await idFile.arrayBuffer();
    const idBuffer = Buffer.from(idBytes);

    const { error: uploadIdErr } = await service.storage
      .from("verification-docs")
      .upload(idPath, idBuffer, {
        contentType: idFile.type || "image/png",
        upsert: true,
      });

    if (!uploadIdErr) {
      const { data: publicUrlData } = service.storage.from("verification-docs").getPublicUrl(idPath);
      idUrl = publicUrlData.publicUrl || idPath;
    } else {
      // Fallback to data URL
      const base64 = idBuffer.toString("base64");
      idUrl = `data:${idFile.type || "image/png"};base64,${base64}`;
    }
  } catch {
    const idBytes = await idFile.arrayBuffer();
    const base64 = Buffer.from(idBytes).toString("base64");
    idUrl = `data:${idFile.type || "image/png"};base64,${base64}`;
  }

  // Upload Pay Slip
  try {
    const empPath = `${profile.org_id}/${profile.id}/payslip-${Date.now()}-${empFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const empBytes = await empFile.arrayBuffer();
    const empBuffer = Buffer.from(empBytes);

    const { error: uploadEmpErr } = await service.storage
      .from("verification-docs")
      .upload(empPath, empBuffer, {
        contentType: empFile.type || "image/png",
        upsert: true,
      });

    if (!uploadEmpErr) {
      const { data: publicUrlData } = service.storage.from("verification-docs").getPublicUrl(empPath);
      empUrl = publicUrlData.publicUrl || empPath;
    } else {
      // Fallback to data URL
      const base64 = empBuffer.toString("base64");
      empUrl = `data:${empFile.type || "image/png"};base64,${base64}`;
    }
  } catch {
    const empBytes = await empFile.arrayBuffer();
    const base64 = Buffer.from(empBytes).toString("base64");
    empUrl = `data:${empFile.type || "image/png"};base64,${base64}`;
  }

  // Update profile with URLs and set status to pending
  const { error: updateErr } = await service
    .from("profiles")
    .update({
      id_proof_url: idUrl,
      employment_proof_url: empUrl,
      verification_status: "pending",
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateErr) {
    return { error: updateErr.message || "Failed to update profile verification status." };
  }

  // Also sync to borrowers table if present
  try {
    await service
      .from("borrowers")
      .update({
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {}

  // Send notification to organization lenders
  try {
    await service.from("notifications").insert({
      org_id: profile.org_id,
      user_id: user.id,
      title: "PAN Card & Pay Slip Submitted",
      message: `${profile.full_name || "A borrower"} uploaded new verification documents for review.`,
      type: "verification_decision",
      read: false,
    });
  } catch {}

  return { success: true };
}
