import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user_id");
        const all = searchParams.get("all");
        const id = searchParams.get("id");

        // Admin: fetch all submissions — one per user (latest row per user_id)
        if (all === "true") {
            const { data, error } = await supabase
                .from("portfolio_submissions")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            // Deduplicate: keep only the latest row per user_id
            const seen = new Set<string>();
            const deduped = (data ?? []).filter((row: any) => {
                const key = row.user_id ?? row.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            return NextResponse.json({ submissions: deduped }, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        // Fetch single submission by row ID
        if (id) {
            const { data, error } = await supabase
                .from("portfolio_submissions")
                .select("*")
                .eq("id", Number(id))
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ submission: data }, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        // Fetch by user_id (for portform upsert check)
        if (!userId) {
            return NextResponse.json({ error: "user_id or id or all is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("portfolio_submissions")
            .select("id, portfolio_files")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ id: data?.id ?? null, portfolio_files: data?.portfolio_files ?? [] }, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { user_id, full_name, degree_program, campus, photo_url, signature, portfolio_files } = body;

        console.log("[PATCH /api/portfolio-submission] user_id:", user_id);
        console.log("[PATCH /api/portfolio-submission] portfolio_files received:", JSON.stringify(portfolio_files));

        if (!user_id) {
            return NextResponse.json({ error: "user_id is required" }, { status: 400 });
        }

        // Fetch existing row by user_id
        const { data: existing, error: fetchError } = await supabase
            .from("portfolio_submissions")
            .select("id, portfolio_files")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        console.log("[PATCH] existing row:", JSON.stringify(existing), "fetchError:", fetchError?.message);

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (existing) {
            // Merge: keep existing files, add new ones (avoid duplicates by fileName+key)
            const existingFiles: any[] = existing.portfolio_files ?? [];
            const newFiles: any[] = portfolio_files ?? [];
            const merged = [...existingFiles];
            for (const nf of newFiles) {
                const isDupe = merged.some(ef => ef.key === nf.key && ef.fileName === nf.fileName);
                if (!isDupe) merged.push(nf);
            }

            console.log("[PATCH] merged files count:", merged.length);

            const { data: updateData, error: updateError } = await supabase
                .from("portfolio_submissions")
                .update({
                    full_name,
                    degree_program,
                    campus,
                    photo_url,
                    signature,
                    portfolio_files: merged,
                    status: "Submitted",
                })
                .eq("id", existing.id)
                .select()
                .single();

            console.log("[PATCH] update result:", JSON.stringify(updateData), "error:", updateError?.message);

            if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
            return NextResponse.json({ success: true, action: "updated", id: existing.id, fileCount: merged.length });
        } else {
            // No existing row — insert fresh
            const { data: insertData, error: insertError } = await supabase
                .from("portfolio_submissions")
                .insert({
                    user_id,
                    full_name,
                    degree_program,
                    campus,
                    photo_url,
                    signature,
                    status: "Submitted",
                    portfolio_files: portfolio_files ?? [],
                })
                .select()
                .single();

            console.log("[PATCH] insert result:", JSON.stringify(insertData), "error:", insertError?.message);

            if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
            return NextResponse.json({ success: true, action: "inserted", fileCount: (portfolio_files ?? []).length });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
