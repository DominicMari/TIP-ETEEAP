// Feature: notifications-and-email-automation, Property 4: Unread badge display
// Validates: Requirements 3.2, 3.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getBadgeDisplay } from '../app/admin/dashboard/notificationUtils';

describe('Property 4: Unread badge display', () => {
    it('shows no badge (null) when count is 0', () => {
        expect(getBadgeDisplay(0)).toBeNull();
    });

    it('shows the count as a string when 0 < count <= 99', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 99 }),
                (n) => {
                    const badge = getBadgeDisplay(n);
                    expect(badge).toBe(String(n));
                }
            ),
            { numRuns: 200 }
        );
    });

    it('shows "99+" when count > 99', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100, max: 10_000 }),
                (n) => {
                    const badge = getBadgeDisplay(n);
                    expect(badge).toBe('99+');
                }
            ),
            { numRuns: 200 }
        );
    });

    it('boundary: count = 99 shows "99", count = 100 shows "99+"', () => {
        expect(getBadgeDisplay(99)).toBe('99');
        expect(getBadgeDisplay(100)).toBe('99+');
    });

    it('negative counts produce no badge (treated as 0)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -10_000, max: -1 }),
                (n) => {
                    const badge = getBadgeDisplay(n);
                    expect(badge).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
});
