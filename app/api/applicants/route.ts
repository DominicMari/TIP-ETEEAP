// app/api/applicants/route.ts

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Fetch applications by email (user-facing)
    if (email) {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "application_id, applicant_name, degree_applied_for, campus, status, admin_remarks, created_at, updated_at"
        )
        .eq("email_address", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ applications: data || [] });
    }

    // List all users (admin)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}