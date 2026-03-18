import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Step 1: get user id from email
    const { data: user } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email ?? "")
        .maybeSingle();

    // Step 2: get ALL portfolio_submissions rows for this user_id
    const { data: byUserId } = user?.id ? await supabase
        .from("portfolio_submissions")
        .select("id, user_id, full_name, portfolio_files, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) : { data: [] };

    // Step 3: get ALL rows (to see orphans)
    const { data: allRows } = await supabase
        .from("portfolio_submissions")
        .select("id, user_id, full_name, portfolio_files, created_at, status")
        .order("created_at", { ascending: false })
        .limit(20);

    return NextResponse.json({
        user,
        rowsMatchingUserId: byUserId,
        allRecentRows: allRows,
    });
}
