/**
 * Returns a status-appropriate remarks template string for the given application status.
 * Returns an empty string for unrecognised status values.
 */
export function getRemarksTemplate(status: string): string {
    const templates: Record<string, string> = {
        Submitted:
            'Thank you for starting your application. Please complete all required sections to proceed with the review process.',
        Pending:
            'Your application is currently under review. Our team will carefully assess your qualifications and experience. You will be notified once a decision has been made.',
        'Competency Process':
            'Your application review is complete and you are now proceeding to the Competency Process. Please wait for further instructions from the admissions team.',
        Enrolled:
            'Congratulations! You are now marked as Enrolled. Please check your email for your enrollment instructions and schedule.',
        Graduated:
            'Congratulations! Your status is now marked as Graduated. We are proud of your achievement.',
    };
    return Object.hasOwn(templates, status) ? templates[status] : '';
}
