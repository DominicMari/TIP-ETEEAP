import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { FileFeedbackEntry } from "@/lib/types/fileFeedback";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_SOURCE_TYPES = ["application", "portfolio"] as const;
type SourceType = (typeof ALLOWED_SOURCE_TYPES)[number];

// Pure helper: append a new entry to an existing (possibly null) array
export function appendFeedbackEntry(
    existing: FileFeedbackEntry[] | null | undefined,
    newEntry: FileFeedbackEntry
): FileFeedbackEntry[] {
    return [...(existing ?? []), newEntry];
}

// Pure helper: build the email body for a feedback notification
export function buildFeedbackEmailBody(
    applicantName: string | null,
    fileName: string,
    message: string
): string {
    const name = applicantName ?? "Applicant";
    const escapedFileName = fileName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedMessage = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    return (
        `<p>Dear ${name},</p>` +
        `<p>An administrator has provided feedback on one of your submitted files.</p>` +
        `<p><strong>File:</strong> ${escapedFileName}</p>` +
        `<p><strong>Feedback:</strong><br>${escapedMessage}</p>` +
        `<p>Please log in to your tracker page to review this feedback and take any necessary action.</p>` +
        `<p>Regards,<br>TIP ETEEAP Team</p>`
    );
}

export async function POST(req: NextRequest) {
    // Require authenticated admin session
    const session = await getServerSession(authOptions as any);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sourceType, recordId, fileName, message, adminName } = body;

    // Validate sourceType
    if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) {
        return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
    }

    // Validate recordId
    if (!recordId || String(recordId).trim() === "") {
        return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }

    // Validate fileName
    if (!fileName || String(fileName).trim() === "") {
        return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    // Validate message
    if (!message || String(message).trim() === "") {
        return NextResponse.json(
            { error: "message field is required and must be non-empty" },
            { status: 400 }
        );
    }
    if (String(message).length > 2000) {
        return NextResponse.json(
            { error: "message must not exceed 2000 characters" },
            { status: 400 }
        );
    }

    // Determine table / column names from sourceType
    const table = sourceType === "application" ? "applications" : "portfolio_submissions";
    const idColumn = sourceType === "application" ? "application_id" : "id";

    // Fetch current record
    const { data: record, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq(idColumn, recordId)
        .single();

    if (fetchError || !record) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Build new entry
    const newEntry: FileFeedbackEntry = {
        fileName: String(fileName),
        message: String(message),
        adminName: adminName ? String(adminName) : "Admin",
        createdAt: new Date().toISOString(),
    };

    // Append to existing array (treat null as [])
    const updatedFeedback = appendFeedbackEntry(record.file_feedback, newEntry);

    // Persist update
    const { error: updateError } = await supabase
        .from(table)
        .update({ file_feedback: updatedFeedback })
        .eq(idColumn, recordId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
    }

    // Resolve applicant email and name
    let applicantEmail: string | null = null;
    let applicantName: string | null = null;

    if (sourceType === "application") {
        applicantEmail = record.email_address ?? null;
        applicantName = record.applicant_name ?? null;
    } else {
        // portfolio: fetch linked application via user_id
        if (record.user_id) {
            const { data: appRecord } = await supabase
                .from("applications")
                .select("email_address, applicant_name")
                .eq("user_id", record.user_id)
                .single();
            applicantEmail = appRecord?.email_address ?? null;
        }
        applicantName = record.full_name ?? null;
    }

    // Send email notification (non-blocking — failure does not revert DB update)
    if (applicantEmail) {
        try {
            const emailBody = buildFeedbackEmailBody(applicantName, String(fileName), String(message));
            const emailRes = await fetch(
                new URL("/api/send-email", req.url).toString(),
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipient: applicantEmail,
                        subject: "File Feedback – TIP ETEEAP",
                        body: emailBody,
                    }),
                }
            );
            if (!emailRes.ok) {
                const errText = await emailRes.text();
                console.error("Failed to send file feedback email:", errText);
            }
        } catch (emailErr) {
            console.error("Error calling /api/send-email:", emailErr);
        }
    }

    return NextResponse.json({ success: true, entry: newEntry });
}
