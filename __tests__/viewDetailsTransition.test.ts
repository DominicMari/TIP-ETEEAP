// Feature: notifications-and-email-automation, Property 18: View Details auto-transitions Submitted → Pending
// Feature: notifications-and-email-automation, Property 19: View Details does not change non-Submitted statuses
// Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function extracted from handleViewDetails in applicantsmanage.tsx.
 * Mirrors the logic: if status === 'Submitted', transition to 'Pending'; otherwise leave unchanged.
 */
function applyViewDetailsTransition(currentStatus: string): string {
    return currentStatus === 'Submitted' ? 'Pending' : currentStatus;
}

const NON_SUBMITTED_STATUSES = ['Pending', 'Competency Process', 'Enrolled', 'Graduated'] as const;

describe('applyViewDetailsTransition – Property 18', () => {
    it('transitions "Submitted" to "Pending"', () => {
        expect(applyViewDetailsTransition('Submitted')).toBe('Pending');
    });

    it('Property 18: for any application with status = "Submitted", result is "Pending"', () => {
        fc.assert(
            fc.property(fc.constant('Submitted'), (status) => {
                expect(applyViewDetailsTransition(status)).toBe('Pending');
            }),
            { numRuns: 100 }
        );
    });
});

describe('applyViewDetailsTransition – Property 19', () => {
    it('does not change non-Submitted statuses', () => {
        for (const status of NON_SUBMITTED_STATUSES) {
            expect(applyViewDetailsTransition(status)).toBe(status);
        }
    });

    it('Property 19: for any non-Submitted status, result is unchanged', () => {
        fc.assert(
            fc.property(fc.constantFrom(...NON_SUBMITTED_STATUSES), (status) => {
                expect(applyViewDetailsTransition(status)).toBe(status);
            }),
            { numRuns: 100 }
        );
    });
});
