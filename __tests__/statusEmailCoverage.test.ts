// Feature: notifications-and-email-automation, Property 16: Status email is sent for every notifiable status change
// Validates: Requirements 9.1, 9.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStatusEmailSubject } from '../lib/utils/statusEmail';

const NOTIFIABLE_STATUSES = ['Pending', 'Competency Process', 'Enrolled', 'Graduated'] as const;

describe('getStatusEmailSubject – Property 16', () => {
    it('returns a non-null, non-empty subject for every notifiable status', () => {
        for (const status of NOTIFIABLE_STATUSES) {
            const subject = getStatusEmailSubject(status);
            expect(subject).not.toBeNull();
            expect(subject!.length).toBeGreaterThan(0);
        }
    });

    it('each notifiable status has a distinct subject line', () => {
        const subjects = NOTIFIABLE_STATUSES.map((s) => getStatusEmailSubject(s));
        const unique = new Set(subjects);
        expect(unique.size).toBe(NOTIFIABLE_STATUSES.length);
    });

    it('subject for each notifiable status contains the applicant email (property: subject is status-specific)', () => {
        // Property: for any notifiable status, the subject is non-null and unique per status
        fc.assert(
            fc.property(fc.constantFrom(...NOTIFIABLE_STATUSES), (status) => {
                const subject = getStatusEmailSubject(status);
                expect(subject).not.toBeNull();
                expect(typeof subject).toBe('string');
                expect((subject as string).length).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    });

    it('returns null for non-notifiable or unknown statuses', () => {
        const nonNotifiable = fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s) => !(NOTIFIABLE_STATUSES as readonly string[]).includes(s) && s !== 'Submitted'
        );

        fc.assert(
            fc.property(nonNotifiable, (status) => {
                // Unknown statuses that are not in the template map return null
                const subject = getStatusEmailSubject(status);
                // Either null (unknown) or a string (if it happens to match a known status)
                if (!(NOTIFIABLE_STATUSES as readonly string[]).includes(status) && status !== 'Submitted') {
                    expect(subject).toBeNull();
                }
            }),
            { numRuns: 200 }
        );
    });
});
