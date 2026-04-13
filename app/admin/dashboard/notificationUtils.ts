import { formatElapsedTime } from '../../../lib/utils/formatElapsedTime';

/**
 * Returns the badge label for a given unread count.
 * - 0       → null (no badge)
 * - 1–99   → the count as a string
 * - > 99   → "99+"
 */
export function getBadgeDisplay(count: number): string | null {
    if (count <= 0) return null;
    if (count > 99) return '99+';
    return String(count);
}

/**
 * Formats a notification record into the display fields shown in the dropdown.
 */
export function formatNotificationItem(notification: {
    type?: string;
    applicant_name: string | null;
    created_at: string;
}): { name: string; message: string; elapsedTime: string } {
    const name = notification.applicant_name ?? 'Unknown Applicant';

    let message: string;
    switch (notification.type) {
        case 'new_portfolio':
            message = 'submitted a portfolio';
            break;
        case 'portfolio_edited':
            message = 'edited their portfolio';
            break;
        case 'application_edited':
            message = 'has edited their application';
            break;
        default:
            message = 'has submitted an application';
    }

    return {
        name,
        message,
        elapsedTime: formatElapsedTime(notification.created_at),
    };
}
