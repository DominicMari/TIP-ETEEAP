// Feature: notifications-and-email-automation, Property 14: Status template mapping is total and non-empty
// Validates: Requirements 7.4

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRemarksTemplate } from '../lib/utils/remarksTemplates';

const VALID_STATUSES = [
    'Submitted',
    'Pending',
    'Competency Process',
    'Enrolled',
    'Graduated',
] as const;

describe('Property 14: Status template mapping is total and non-empty', () => {
    it('returns a non-empty string for each of the 5 valid status values', () => {
        for (const status of VALID_STATUSES) {
            const result = getRemarksTemplate(status);
            expect(typeof result).toBe('string');
            expect(result.trim().length).toBeGreaterThan(0);
        }
    });

    it('property: for any valid status, getRemarksTemplate returns a non-empty string', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...VALID_STATUSES),
                (status) => {
                    const result = getRemarksTemplate(status);
                    expect(typeof result).toBe('string');
                    expect(result.trim().length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('each status maps to a distinct template', () => {
        const templates = VALID_STATUSES.map((s) => getRemarksTemplate(s));
        const unique = new Set(templates);
        expect(unique.size).toBe(VALID_STATUSES.length);
    });

    it('returns an empty string for an unrecognised status', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(
                    (s) => !(VALID_STATUSES as readonly string[]).includes(s)
                ),
                (unknownStatus) => {
                    const result = getRemarksTemplate(unknownStatus);
                    expect(result).toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });
});
