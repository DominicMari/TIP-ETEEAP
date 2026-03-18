import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (userError || !userData?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("user_id", userData.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // PGRST116 = no rows found, not a real error
            if (error.code === "PGRST116") {
                return NextResponse.json({ application: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ application: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { email, payload } = await request.json();

        if (!email || !payload) {
            return NextResponse.json({ error: "Email and payload are required" }, { status: 400 });
        }

        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (userError || !userData?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("applications")
            .update(payload)
            .eq("user_id", userData.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
