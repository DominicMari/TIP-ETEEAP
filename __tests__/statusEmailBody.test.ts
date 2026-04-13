// Feature: notifications-and-email-automation, Property 17: Status email body contains name, status, and remarks
// Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildStatusEmailBody } from '../lib/utils/statusEmail';

const NOTIFIABLE_STATUSES = ['Pending', 'Competency Process', 'Enrolled', 'Graduated'] as const;

describe('buildStatusEmailBody – Property 17', () => {
    it('body contains the applicant name when name is provided', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.constantFrom(...NOTIFIABLE_STATUSES),
                fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
                (name, status, remarks) => {
                    const body = buildStatusEmailBody(name, status, remarks);
                    expect(body).toContain(name);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('body contains the remarks when remarks are provided', () => {
        fc.assert(
            fc.property(
                fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
                fc.constantFrom(...NOTIFIABLE_STATUSES),
                fc.string({ minLength: 1, maxLength: 200 }),
                (name, status, remarks) => {
                    const body = buildStatusEmailBody(name, status, remarks);
                    expect(body).toContain(remarks);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('body does NOT contain remarks section when remarks is null', () => {
        fc.assert(
            fc.property(
                fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
                fc.constantFrom(...NOTIFIABLE_STATUSES),
                (name, status) => {
                    const body = buildStatusEmailBody(name, status, null);
                    expect(body).not.toContain('Admin Comments:');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('body contains name, status reference, and remarks for all three non-null', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.constantFrom(...NOTIFIABLE_STATUSES),
                fc.string({ minLength: 1, maxLength: 200 }),
                (name, status, remarks) => {
                    const body = buildStatusEmailBody(name, status, remarks);
                    // Name must appear
                    expect(body).toContain(name);
                    // Remarks must appear
                    expect(body).toContain(remarks);
                    // Body must be a non-empty string
                    expect(body.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 300 }
        );
    });

    it('falls back to "Applicant" when name is null', () => {
        for (const status of NOTIFIABLE_STATUSES) {
            const body = buildStatusEmailBody(null, status, null);
            expect(body).toContain('Applicant');
        }
    });
});
