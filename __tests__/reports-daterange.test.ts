// Feature: notifications-and-email-automation, Property 21: Date range filter excludes out-of-range records
// Validates: Requirements 10.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByDateRange, ApplicationRecord } from '../lib/utils/reportsUtils';

const MIN_TS = 1577836800000; // 2020-01-01T00:00:00Z
const MAX_TS = 1924905600000; // 2031-01-01T00:00:00Z

/** Arbitrary that generates a minimal ApplicationRecord with a valid ISO created_at */
const recordWithDateArb = fc.record<ApplicationRecord>({
    application_id: fc.uuid(),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    email_address: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    degree_applied_for: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    campus: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    status: fc.option(fc.constantFrom('Submitted', 'Pending', 'Competency Process', 'Enrolled', 'Graduated'), { nil: null }),
    created_at: fc.integer({ min: MIN_TS, max: MAX_TS }).map((ms) => new Date(ms).toISOString()),
    admin_remarks: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
});

const recordsArb = fc.array(recordWithDateArb, { minLength: 0, maxLength: 100 });

/**
 * Generates a pair of YYYY-MM-DD date strings [start, end] where start <= end.
 * Uses timestamps within the same range as the records.
 */
const dateRangeArb = fc
    .tuple(
        fc.integer({ min: MIN_TS, max: MAX_TS }),
        fc.integer({ min: MIN_TS, max: MAX_TS })
    )
    .map(([a, b]) => {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const toDateStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);
        return [toDateStr(lo), toDateStr(hi)] as [string, string];
    });

describe('Property 21: Date range filter excludes out-of-range records', () => {
    it('all returned records have created_at within [start, end] (inclusive)', () => {
        fc.assert(
            fc.property(recordsArb, dateRangeArb, (records, [startStr, endStr]) => {
                const result = filterByDateRange(records, startStr, endStr);

                const startTs = new Date(startStr).getTime();
                const endTs = new Date(endStr + 'T23:59:59.999Z').getTime();

                for (const r of result) {
                    const ts = new Date(r.created_at!).getTime();
                    expect(ts).toBeGreaterThanOrEqual(startTs);
                    expect(ts).toBeLessThanOrEqual(endTs);
                }
            }),
            { numRuns: 300 }
        );
    });

    it('no out-of-range records appear in the filtered result', () => {
        fc.assert(
            fc.property(recordsArb, dateRangeArb, (records, [startStr, endStr]) => {
                const result = filterByDateRange(records, startStr, endStr);
                const resultIds = new Set(result.map((r) => r.application_id));

                const startTs = new Date(startStr).getTime();
                const endTs = new Date(endStr + 'T23:59:59.999Z').getTime();

                for (const r of records) {
                    if (!r.created_at) {
                        expect(resultIds.has(r.application_id)).toBe(false);
                        continue;
                    }
                    const ts = new Date(r.created_at).getTime();
                    const inRange = ts >= startTs && ts <= endTs;
                    expect(resultIds.has(r.application_id)).toBe(inRange);
                }
            }),
            { numRuns: 300 }
        );
    });

    it('returns all records when no filter is applied (both null)', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const result = filterByDateRange(records, null, null);
                expect(result.length).toBe(records.length);
            }),
            { numRuns: 200 }
        );
    });

    it('returns an empty array when no records fall within the range', () => {
        const records: ApplicationRecord[] = [
            {
                application_id: 'a1',
                applicant_name: 'Alice',
                email_address: null,
                degree_applied_for: null,
                campus: null,
                status: 'Submitted',
                created_at: '2025-06-15T10:00:00.000Z',
                admin_remarks: null,
            },
        ];
        const result = filterByDateRange(records, '2010-01-01', '2010-12-31');
        expect(result).toHaveLength(0);
    });

    it('includes records exactly on the start boundary and excludes records after end boundary', () => {
        const records: ApplicationRecord[] = [
            {
                application_id: 'b1',
                applicant_name: 'Bob',
                email_address: null,
                degree_applied_for: null,
                campus: null,
                status: 'Pending',
                created_at: '2024-03-01T00:00:00.000Z', // exactly start (UTC midnight)
                admin_remarks: null,
            },
            {
                application_id: 'b2',
                applicant_name: 'Carol',
                email_address: null,
                degree_applied_for: null,
                campus: null,
                status: 'Enrolled',
                created_at: '2024-03-31T23:59:59.999Z', // exactly end-of-day UTC
                admin_remarks: null,
            },
            {
                application_id: 'b3',
                applicant_name: 'Dave',
                email_address: null,
                degree_applied_for: null,
                campus: null,
                status: 'Graduated',
                created_at: '2024-04-01T00:00:00.000Z', // one ms after end boundary
                admin_remarks: null,
            },
        ];
        const result = filterByDateRange(records, '2024-03-01', '2024-03-31');
        const ids = result.map((r) => r.application_id);
        expect(ids).toContain('b1');
        expect(ids).toContain('b2');
        expect(ids).not.toContain('b3');
    });
});
