import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/recruiters/[id] — Update recruiter (assigned clients, active status)
 * DELETE /api/admin/recruiters/[id] — Deactivate recruiter account
 * POST   /api/admin/recruiters/[id]/resend — Re-send invitation
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.assigned_client_ids !== undefined)
      updates.assigned_client_ids = body.assigned_client_ids;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.role !== undefined && ["admin", "recruiter"].includes(body.role))
      updates.role = body.role;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error("[api/admin/recruiters/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Safety: don't let admins delete themselves
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Deactivate instead of hard delete (preserves data integrity)
    await admin
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id);

    // Optionally: ban the user in auth
    await admin.auth.admin.updateUserById(id, {
      ban_duration: "876000h", // 100 years
    });

    return NextResponse.json({ success: true, message: "Recruiter deactivated" });
  } catch (error) {
    console.error("[api/admin/recruiters/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
