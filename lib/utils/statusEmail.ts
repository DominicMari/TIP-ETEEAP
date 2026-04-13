/**
 * Status email utility functions extracted from applicantsmanage.tsx for testability.
 */

const NOTIFIABLE_STATUSES = ['Submitted', 'Pending', 'Competency Process', 'Enrolled', 'Graduated'] as const;

const EMAIL_SUBJECTS: Record<string, string> = {
    Submitted: 'Application Received - TIP ETEEAP',
    Pending: 'Application Under Review - TIP ETEEAP',
    'Competency Process': 'Proceed to Competency Process - TIP ETEEAP',
    Enrolled: 'Enrollment Status Update - TIP ETEEAP',
    Graduated: 'Graduation Status Update - TIP ETEEAP',
};

/**
 * Returns the email subject for a given status, or null if the status is not notifiable.
 */
export function getStatusEmailSubject(status: string): string | null {
    if (!Object.prototype.hasOwnProperty.call(EMAIL_SUBJECTS, status)) return null;
    return EMAIL_SUBJECTS[status] ?? null;
}

/**
 * Builds the email body for a status change email.
 * Always includes the applicant name, status, and remarks (when provided).
 */
export function buildStatusEmailBody(
    name: string | null,
    status: string,
    remarks: string | null
): string {
    const displayName = name || 'Applicant';

    const bodyTemplates: Record<string, string> = {
        Submitted: `Dear ${displayName},\n\nThank you for submitting your application to the TIP ETEEAP program. We have received your application and it is now in our system.\n\nPlease continue to complete any remaining sections of your application. Our team will begin reviewing your submission shortly.\n\nBest regards,\nTIP ETEEAP Team`,
        Pending: `Dear ${displayName},\n\nYour application is now under review. Our assessment team is carefully evaluating your qualifications, experience, and fit for the program.\n\nYou will be notified of the decision as soon as the review process is complete.\n\nThank you for your patience.\n\nBest regards,\nTIP ETEEAP Team`,
        'Competency Process': `Dear ${displayName},\n\nYour application review has been completed and you are now endorsed to proceed to the Competency Process.\n\nPlease wait for the next instructions from the TIP ETEEAP team regarding schedules and requirements.\n\nBest regards,\nTIP ETEEAP Team`,
        Enrolled: `Dear ${displayName},\n\nCongratulations! Your status has been updated to Enrolled.\n\nPlease review your email and follow the enrollment instructions sent by the TIP ETEEAP team.\n\nBest regards,\nTIP ETEEAP Team`,
        Graduated: `Dear ${displayName},\n\nCongratulations! Your status has been updated to Graduated.\n\nWe commend your accomplishment and wish you continued success.\n\nBest regards,\nTIP ETEEAP Team`,
    };

    const baseBody = bodyTemplates[status] ?? `Dear ${displayName},\n\nYour application status has been updated to: ${status}.\n\nBest regards,\nTIP ETEEAP Team`;

    return remarks ? `${baseBody}\n\n---\nAdmin Comments:\n${remarks}` : baseBody;
}

/**
 * Sends a status change email via the /api/send-email route.
 * Failures are logged to console but do not throw — the status change is never reverted.
 */
export async function sendStatusEmail(
    applicantEmail: string | null,
    applicantName: string | null,
    status: string,
    remarks: string | null
): Promise<void> {
    if (!applicantEmail) {
        console.warn('No email address available for applicant');
        return;
    }

    const subject = getStatusEmailSubject(status);
    if (!subject) {
        console.warn(`No email template found for status: ${status}`);
        return;
    }

    const body = buildStatusEmailBody(applicantName, status, remarks);

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: applicantEmail, subject, body }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to send email:', error.error);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
