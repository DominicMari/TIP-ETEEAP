import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
    try {
        const { table, idColumn, id, status, extra } = await request.json();

        if (!table || !idColumn || !id || !status) {
            return NextResponse.json({ error: "table, idColumn, id, and status are required" }, { status: 400 });
        }

        const allowedTables = ["applications", "portfolio_submissions"];
        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: "Invalid table" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from(table)
            .update({ status, updated_at: new Date().toISOString(), ...(extra || {}) })
            .eq(idColumn, id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
