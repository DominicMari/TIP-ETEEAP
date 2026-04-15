import type { FileFeedbackEntry } from "@/lib/types/fileFeedback";

/**
 * Appends a new FileFeedbackEntry to an existing array.
 * Treats null/undefined as an empty array.
 */
export function appendFeedbackEntry(
    existing: FileFeedbackEntry[] | null | undefined,
    newEntry: FileFeedbackEntry
): FileFeedbackEntry[] {
    return [...(existing ?? []), newEntry];
}

/**
 * Builds the HTML email body for a file feedback notification.
 */
export function buildFeedbackEmailBody(
    applicantName: string | null,
    fileName: string,
    message: string
): string {
    const name = applicantName ?? "Applicant";
    const escapedFileName = fileName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedMessage = message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
    return (
        `<p>Dear ${name},</p>` +
        `<p>An administrator has provided feedback on one of your submitted files.</p>` +
        `<p><strong>File:</strong> ${escapedFileName}</p>` +
        `<p><strong>Feedback:</strong><br>${escapedMessage}</p>` +
        `<p>Please log in to your tracker page to review this feedback and take any necessary action.</p>` +
        `<p>Regards,<br>TIP ETEEAP Team</p>`
    );
}
