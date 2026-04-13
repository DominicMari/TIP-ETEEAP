// Feature: notifications-and-email-automation, Property 10: File size validation enforces 10 MB limit
// Validates: Requirements 5.2, 5.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFile, MAX_FILE_SIZE_BYTES } from '../lib/utils/validateFile';

// Use a valid MIME type so size is the only variable under test
const VALID_MIME = 'image/jpeg';

describe('validateFile file size – Property 10', () => {
    it('returns valid=true for file sizes at or below 10 MB (10,485,760 bytes)', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: MAX_FILE_SIZE_BYTES }), (size) => {
                const result = validateFile({ type: VALID_MIME, size });
                expect(result.valid).toBe(true);
                expect(result.error).toBeNull();
            }),
            { numRuns: 300 }
        );
    });

    it('returns valid=false with a size-related error for file sizes above 10 MB', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: MAX_FILE_SIZE_BYTES * 10 }),
                (size) => {
                    const result = validateFile({ type: VALID_MIME, size });
                    expect(result.valid).toBe(false);
                    expect(result.error).not.toBeNull();
                    expect(result.error!.toLowerCase()).toContain('size');
                }
            ),
            { numRuns: 300 }
        );
    });

    it('boundary: exactly 10,485,760 bytes is valid', () => {
        const result = validateFile({ type: VALID_MIME, size: MAX_FILE_SIZE_BYTES });
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    it('boundary: 10,485,761 bytes is invalid', () => {
        const result = validateFile({ type: VALID_MIME, size: MAX_FILE_SIZE_BYTES + 1 });
        expect(result.valid).toBe(false);
        expect(result.error).not.toBeNull();
    });
});
