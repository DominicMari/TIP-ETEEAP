import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { EmailTemplate } from "@/app/emails/template";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "admin@tipeteeap.online";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");
        const userId = searchParams.get("user_id");

        let resolvedUserId: string | null = null;

        if (userId) {
            resolvedUserId = userId;
        } else if (email) {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("email", email)
                .single();

            if (userError || !userData?.id) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            resolvedUserId = userData.id;
        } else {
            return NextResponse.json({ error: "email or user_id is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("user_id", resolvedUserId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ application: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ application: data }, {
            headers: { "Cache-Control": "no-store" },
        });
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

        // Insert edit notification (non-blocking)
        try {
            await supabase.from("notifications").insert({
                type: "application_edited",
                applicant_name: payload.applicant_name ?? null,
                application_id: null,
                is_read: false,
            });
        } catch (notifErr) {
            console.error("Failed to insert edit notification:", notifErr);
        }

        // Send edit confirmation email (non-blocking)
        try {
            const applicantName = payload.applicant_name ?? "Applicant";
            await resend.emails.send({
                from: `TIP Tech Support <${FROM_EMAIL}>`,
                to: [email],
                subject: "Application Updated – TIP ETEEAP",
                react: EmailTemplate({
                    subject: "Application Updated – TIP ETEEAP",
                    body: `Dear <strong>${applicantName}</strong>,<br><br>You have edited your existing application. Please wait for further announcements from the coordinator/assessor.<br><br>Best regards,<br>TIP ETEEAP Team`,
                }),
            });
        } catch (emailErr) {
            console.error("Failed to send edit confirmation email:", emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
    }
}
