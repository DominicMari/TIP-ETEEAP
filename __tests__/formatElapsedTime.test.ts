// Feature: notifications-and-email-automation, Property 7: Elapsed time formatting correctness
// Validates: Requirements 4.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatElapsedTime } from '../lib/utils/formatElapsedTime';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Returns an ISO timestamp string that is `offsetMs` milliseconds in the past.
 */
function pastTimestamp(offsetMs: number): string {
    return new Date(Date.now() - offsetMs).toISOString();
}

describe('formatElapsedTime – Property 7', () => {
    it('returns "just now" for timestamps less than 60 seconds ago', () => {
        // Generate offsets in [0, 59999] ms
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 59_999 }), (offsetMs) => {
                const ts = pastTimestamp(offsetMs);
                expect(formatElapsedTime(ts)).toBe('just now');
            }),
            { numRuns: 200 }
        );
    });

    it('returns "X minute(s) ago" for timestamps 1–59 minutes ago', () => {
        // Generate offsets in [60s, 59m 59s]
        fc.assert(
            fc.property(
                fc.integer({ min: 1 * MINUTE, max: 59 * MINUTE + 59 * SECOND }),
                (offsetMs) => {
                    const ts = pastTimestamp(offsetMs);
                    const result = formatElapsedTime(ts);
                    expect(result).toMatch(/^\d+ minutes? ago$/);
                    const minutes = parseInt(result, 10);
                    expect(minutes).toBeGreaterThanOrEqual(1);
                    expect(minutes).toBeLessThanOrEqual(59);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('returns "X hour(s) ago" for timestamps 1–23 hours ago', () => {
        // Generate offsets in [1h, 23h 59m 59s]
        fc.assert(
            fc.property(
                fc.integer({ min: 1 * HOUR, max: 23 * HOUR + 59 * MINUTE + 59 * SECOND }),
                (offsetMs) => {
                    const ts = pastTimestamp(offsetMs);
                    const result = formatElapsedTime(ts);
                    expect(result).toMatch(/^\d+ hours? ago$/);
                    const hours = parseInt(result, 10);
                    expect(hours).toBeGreaterThanOrEqual(1);
                    expect(hours).toBeLessThanOrEqual(23);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('returns "X day(s) ago" for timestamps 1–6 days ago', () => {
        // Generate offsets in [1d, 6d 23h 59m 59s]
        fc.assert(
            fc.property(
                fc.integer({ min: 1 * DAY, max: 6 * DAY + 23 * HOUR + 59 * MINUTE + 59 * SECOND }),
                (offsetMs) => {
                    const ts = pastTimestamp(offsetMs);
                    const result = formatElapsedTime(ts);
                    expect(result).toMatch(/^\d+ days? ago$/);
                    const days = parseInt(result, 10);
                    expect(days).toBeGreaterThanOrEqual(1);
                    expect(days).toBeLessThanOrEqual(6);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('returns a formatted date string for timestamps 7 or more days ago', () => {
        // Generate offsets in [7d, 3650d] (up to ~10 years)
        fc.assert(
            fc.property(
                fc.integer({ min: 7 * DAY, max: 3650 * DAY }),
                (offsetMs) => {
                    const ts = pastTimestamp(offsetMs);
                    const result = formatElapsedTime(ts);
                    // Should match "Mon DD, YYYY" e.g. "Jan 5, 2025"
                    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
                    // Should NOT contain "ago"
                    expect(result).not.toContain('ago');
                }
            ),
            { numRuns: 200 }
        );
    });
});
