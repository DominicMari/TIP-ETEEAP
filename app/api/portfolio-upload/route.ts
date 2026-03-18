import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handles file uploads to Supabase Storage using service-role key (bypasses RLS)
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const userId = formData.get("user_id") as string;
        const categoryKey = formData.get("category_key") as string;
        const categoryLabel = formData.get("category_label") as string;
        const file = formData.get("file") as File;

        if (!userId || !categoryKey || !file) {
            return NextResponse.json({ error: "user_id, category_key, and file are required" }, { status: 400 });
        }

        const filePath = `${userId}/portfolio/${categoryKey}_${Date.now()}_${file.name}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabase.storage
            .from("portfolio_files")
            .upload(filePath, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });

        if (error) {
            console.error("[portfolio-upload] storage error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage.from("portfolio_files").getPublicUrl(data.path);

        return NextResponse.json({
            key: categoryKey,
            label: categoryLabel,
            fileName: file.name,
            url: urlData.publicUrl,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
