/**
 * Formats an ISO timestamp string into a human-readable elapsed time string.
 *
 * Rules:
 *  - < 60s       → "just now"
 *  - 1–59 min    → "X minute(s) ago"
 *  - 1–23 h      → "X hour(s) ago"
 *  - 1–6 days    → "X day(s) ago"
 *  - ≥ 7 days    → formatted date e.g. "Jan 5, 2025"
 */
export function formatElapsedTime(createdAt: string): string {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const diffMs = now - created;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
        return 'just now';
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    // ≥ 7 days: return formatted date e.g. "Jan 5, 2025"
    return new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
