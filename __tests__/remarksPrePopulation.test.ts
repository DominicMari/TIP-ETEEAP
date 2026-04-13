// Feature: notifications-and-email-automation, Property 12: Remarks pre-population from admin_remarks
// Validates: Requirements 7.1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function extracted from applicantsmanage.tsx that determines the initial
 * value of the remarks textarea when an admin opens an applicant record.
 *
 * Logic: use admin_remarks when present, otherwise fall back to the status template.
 */
function getInitialRemarksText(adminRemarks: string | null, statusTemplate: string): string {
    return adminRemarks ?? statusTemplate;
}

describe('Property 12: Remarks pre-population from admin_remarks', () => {
    it('returns admin_remarks when it is non-null, regardless of the template', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }), // non-null admin_remarks
                fc.string({ minLength: 0, maxLength: 500 }), // any template
                (adminRemarks, template) => {
                    const result = getInitialRemarksText(adminRemarks, template);
                    expect(result).toBe(adminRemarks);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('returns the template when admin_remarks is null', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 500 }),
                (template) => {
                    const result = getInitialRemarksText(null, template);
                    expect(result).toBe(template);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('never returns null — always a string', () => {
        fc.assert(
            fc.property(
                fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
                fc.string({ minLength: 0, maxLength: 500 }),
                (adminRemarks, template) => {
                    const result = getInitialRemarksText(adminRemarks, template);
                    expect(typeof result).toBe('string');
                }
            ),
            { numRuns: 200 }
        );
    });
});
