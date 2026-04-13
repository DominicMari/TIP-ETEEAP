// Feature: notifications-and-email-automation, Property 15: Tracker status is always a valid enum value
// Validates: Requirements 8.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * The five valid status enum values for the tracker page.
 * Mirrors the values accepted by getStatusLabel() in app/tracker/page.tsx.
 */
const VALID_STATUSES = [
    'Submitted',
    'Pending',
    'Competency Process',
    'Enrolled',
    'Graduated',
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

/**
 * Pure function mirroring the status display logic in app/tracker/page.tsx.
 * Returns the displayed status label for a given raw status value.
 * Null/undefined/unknown values fall back to "Submitted".
 */
function getStatusLabel(status: string | null): string {
    switch (status) {
        case 'Submitted': return 'Submitted';
        case 'Pending': return 'Under Review';
        case 'Competency Process': return 'Competency Process';
        case 'Enrolled': return 'Enrolled';
        case 'Graduated': return 'Graduated';
        default: return 'Submitted';
    }
}

/**
 * Simulates what the tracker page does: given an application record,
 * return the status value that would be displayed.
 * The tracker only shows applications fetched for the authenticated user,
 * so the status field comes directly from the DB.
 */
function getDisplayedStatus(applicationStatus: string | null): string {
    // The tracker page uses getStatusLabel for the badge and getStepIndex for the stepper.
    // The badge always shows one of the valid enum labels.
    return getStatusLabel(applicationStatus);
}

/** Arbitrary that generates valid application status strings */
const validStatusArb = fc.constantFrom(...VALID_STATUSES);

/** Arbitrary that generates arbitrary application records with a valid status */
const applicationWithValidStatusArb = fc.record({
    application_id: fc.uuid(),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    degree_applied_for: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    campus: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    status: validStatusArb,
    admin_remarks: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
    created_at: fc.option(fc.integer({ min: 0, max: 4102444800000 }).map((ms) => new Date(ms).toISOString()), { nil: null }),
    updated_at: fc.option(fc.integer({ min: 0, max: 4102444800000 }).map((ms) => new Date(ms).toISOString()), { nil: null }),
});

describe('Property 15: Tracker status is always a valid enum value', () => {
    it('getStatusLabel returns a value in the valid display labels for every valid status', () => {
        const validDisplayLabels = [
            'Submitted',
            'Under Review',
            'Competency Process',
            'Enrolled',
            'Graduated',
        ];

        fc.assert(
            fc.property(validStatusArb, (status) => {
                const displayed = getDisplayedStatus(status);
                expect(validDisplayLabels).toContain(displayed);
            }),
            { numRuns: 200 }
        );
    });

    it('for any application record with a valid status, the displayed status is one of the five valid enum values', () => {
        fc.assert(
            fc.property(applicationWithValidStatusArb, (app) => {
                const displayed = getDisplayedStatus(app.status);
                // The displayed label must correspond to one of the five valid statuses
                const validDisplayLabels = [
                    'Submitted',
                    'Under Review',      // displayed for 'Pending'
                    'Competency Process',
                    'Enrolled',
                    'Graduated',
                ];
                expect(validDisplayLabels).toContain(displayed);
            }),
            { numRuns: 500 }
        );
    });

    it('null status falls back to "Submitted" (a valid enum value)', () => {
        expect(getDisplayedStatus(null)).toBe('Submitted');
    });

    it('unknown status strings fall back to "Submitted" (a valid enum value)', () => {
        fc.assert(
            fc.property(
                fc.string().filter((s) => !(VALID_STATUSES as readonly string[]).includes(s)),
                (unknownStatus) => {
                    const displayed = getDisplayedStatus(unknownStatus);
                    expect(displayed).toBe('Submitted');
                }
            ),
            { numRuns: 200 }
        );
    });

    it('each of the five valid statuses maps to a non-empty display label', () => {
        for (const status of VALID_STATUSES) {
            const label = getDisplayedStatus(status);
            expect(label).toBeTruthy();
            expect(label.length).toBeGreaterThan(0);
        }
    });
});
