// Feature: notifications-and-email-automation, Property 8: Mark all as read sets all is_read to true
// Validates: Requirements 4.4

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

interface Notification {
    id: string;
    type: string;
    applicant_name: string | null;
    application_id: string | null;
    created_at: string;
    is_read: boolean;
}

/**
 * Isolated state transformation logic extracted from useNotifications.markAllAsRead.
 * Given a list of notifications, returns a new list where every item has is_read = true.
 */
function applyMarkAllAsRead(notifications: Notification[]): Notification[] {
    return notifications.map((n) => ({ ...n, is_read: true }));
}

// Arbitrary for a single notification
// Use integer timestamps to avoid edge-case Date shrinking issues
const MIN_TS = new Date('2020-01-01').getTime();
const MAX_TS = new Date('2030-01-01').getTime();

const notificationArb = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('new_application', 'status_change', 'other'),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    application_id: fc.option(fc.uuid(), { nil: null }),
    created_at: fc.integer({ min: MIN_TS, max: MAX_TS }).map((ms) => new Date(ms).toISOString()),
    is_read: fc.boolean(),
});

describe('Property 8: Mark all as read sets all is_read to true', () => {
    it('every notification has is_read = true after markAllAsRead, regardless of initial state', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
                (notifications) => {
                    const result = applyMarkAllAsRead(notifications);

                    // Property: every item in the result has is_read = true
                    expect(result.every((n) => n.is_read === true)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('result length equals input length (no items added or removed)', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
                (notifications) => {
                    const result = applyMarkAllAsRead(notifications);
                    expect(result).toHaveLength(notifications.length);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('all other fields are preserved after markAllAsRead', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 1, maxLength: 50 }),
                (notifications) => {
                    const result = applyMarkAllAsRead(notifications);

                    result.forEach((updated, i) => {
                        const original = notifications[i];
                        expect(updated.id).toBe(original.id);
                        expect(updated.type).toBe(original.type);
                        expect(updated.applicant_name).toBe(original.applicant_name);
                        expect(updated.application_id).toBe(original.application_id);
                        expect(updated.created_at).toBe(original.created_at);
                        // is_read must be true regardless of original value
                        expect(updated.is_read).toBe(true);
                    });
                }
            ),
            { numRuns: 200 }
        );
    });

    it('markAllAsRead is idempotent — applying it twice yields the same result', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
                (notifications) => {
                    const once = applyMarkAllAsRead(notifications);
                    const twice = applyMarkAllAsRead(once);
                    expect(twice).toEqual(once);
                }
            ),
            { numRuns: 200 }
        );
    });
});
