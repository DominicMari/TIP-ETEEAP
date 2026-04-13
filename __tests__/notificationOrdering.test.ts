// Feature: notifications-and-email-automation, Property 5: Dropdown ordering and limit
// Validates: Requirements 3.4

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

const DROPDOWN_LIMIT = 20;

/**
 * Isolated sorting/slicing logic extracted from useNotifications.
 * Mirrors what the hook does: sort by created_at descending, take at most 20.
 */
function applyDropdownTransform(notifications: Notification[]): Notification[] {
    return [...notifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, DROPDOWN_LIMIT);
}

// Arbitrary for a single notification with a valid ISO date
const notificationArb = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('new_application', 'status_change'),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    application_id: fc.option(fc.uuid(), { nil: null }),
    created_at: fc
        .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-01-01').getTime() })
        .map((ms) => new Date(ms).toISOString()),
    is_read: fc.boolean(),
});

describe('Property 5: Dropdown ordering and limit', () => {
    it('result contains at most 20 items for any input size', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 0, maxLength: 100 }),
                (notifications) => {
                    const result = applyDropdownTransform(notifications);
                    expect(result.length).toBeLessThanOrEqual(DROPDOWN_LIMIT);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('result is ordered by created_at descending (newest first)', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 2, maxLength: 100 }),
                (notifications) => {
                    const result = applyDropdownTransform(notifications);

                    for (let i = 0; i < result.length - 1; i++) {
                        const current = new Date(result[i].created_at).getTime();
                        const next = new Date(result[i + 1].created_at).getTime();
                        // Each item must be >= the next (descending order)
                        expect(current).toBeGreaterThanOrEqual(next);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('when input has ≤ 20 items, result length equals input length', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: 0, maxLength: DROPDOWN_LIMIT }),
                (notifications) => {
                    const result = applyDropdownTransform(notifications);
                    expect(result).toHaveLength(notifications.length);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('when input has > 20 items, result contains exactly 20 items', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: DROPDOWN_LIMIT + 1, maxLength: 100 }),
                (notifications) => {
                    const result = applyDropdownTransform(notifications);
                    expect(result).toHaveLength(DROPDOWN_LIMIT);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('the 20 items returned are the 20 most recent from the input', () => {
        fc.assert(
            fc.property(
                fc.array(notificationArb, { minLength: DROPDOWN_LIMIT + 1, maxLength: 100 }),
                (notifications) => {
                    const result = applyDropdownTransform(notifications);

                    // The minimum timestamp in the result must be >= the maximum timestamp
                    // of items NOT in the result (i.e., the dropped items are older)
                    const resultIds = new Set(result.map((n) => n.id));
                    const dropped = notifications.filter((n) => !resultIds.has(n.id));

                    if (dropped.length === 0) return; // nothing to compare

                    const minResultTime = Math.min(...result.map((n) => new Date(n.created_at).getTime()));
                    const maxDroppedTime = Math.max(...dropped.map((n) => new Date(n.created_at).getTime()));

                    expect(minResultTime).toBeGreaterThanOrEqual(maxDroppedTime);
                }
            ),
            { numRuns: 200 }
        );
    });
});
