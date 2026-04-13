// Feature: notifications-and-email-automation, Property 9: File type validation accepts only allowed MIME types
// Validates: Requirements 5.1, 5.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFile, ACCEPTED_MIME_TYPES } from '../lib/utils/validateFile';

const ACCEPTED = [...ACCEPTED_MIME_TYPES];

describe('validateFile MIME type – Property 9', () => {
    it('returns valid=true for each accepted MIME type', () => {
        for (const mimeType of ACCEPTED) {
            const result = validateFile({ type: mimeType, size: 0 });
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        }
    });

    it('returns valid=false with a type-related error for any non-accepted MIME type', () => {
        // Arbitrary MIME-type-like strings that are not in the accepted list
        const nonAcceptedArb = fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !ACCEPTED.includes(s as typeof ACCEPTED[number]));

        fc.assert(
            fc.property(nonAcceptedArb, (mimeType) => {
                const result = validateFile({ type: mimeType, size: 0 });
                expect(result.valid).toBe(false);
                expect(result.error).not.toBeNull();
                expect(result.error!.toLowerCase()).toContain('type');
            }),
            { numRuns: 300 }
        );
    });

    it('valid=true if and only if MIME type is one of the four accepted types', () => {
        // Mix accepted and non-accepted types
        const mimeArb = fc.oneof(
            fc.constantFrom(...ACCEPTED),
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !ACCEPTED.includes(s as typeof ACCEPTED[number]))
        );

        fc.assert(
            fc.property(mimeArb, (mimeType) => {
                const result = validateFile({ type: mimeType, size: 0 });
                const isAccepted = ACCEPTED.includes(mimeType as typeof ACCEPTED[number]);
                expect(result.valid).toBe(isAccepted);
            }),
            { numRuns: 300 }
        );
    });
});
