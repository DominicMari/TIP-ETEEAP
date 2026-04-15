import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
    try {
        const { table, idColumn, id, status, extra } = await request.json() as {
            table: string;
            idColumn: string;
            id: string;
            status: string;
            extra?: Record<string, unknown>;
        };

        if (!table || !idColumn || !id || !status) {
            return NextResponse.json({ error: "table, idColumn, id, and status are required" }, { status: 400 });
        }

        const allowedTables = ["applications", "portfolio_submissions"];
        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: "Invalid table" }, { status: 400 });
        }

        const updatePayload: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
            ...(extra || {}),
        };

        // Split into update + select to avoid deep type instantiation
        const { error: updateError } = await supabase
            .from(table)
            .update(updatePayload)
            .eq(idColumn, id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        const { data, error: selectError } = await supabase
            .from(table)
            .select("*")
            .eq(idColumn, id)
            .single();

        if (selectError) {
            return NextResponse.json({ error: selectError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
