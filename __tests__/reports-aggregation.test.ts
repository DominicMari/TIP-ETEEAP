// Feature: notifications-and-email-automation, Property 20: Report aggregation correctness
// Validates: Requirements 10.1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aggregateByField, ApplicationRecord } from '../lib/utils/reportsUtils';

const MIN_TS = 1577836800000; // 2020-01-01 UTC
const MAX_TS = 1924905600000; // 2031-01-01 UTC

/** Arbitrary that generates a minimal ApplicationRecord */
const applicationRecordArb = fc.record<ApplicationRecord>({
    application_id: fc.uuid(),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    email_address: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    degree_applied_for: fc.option(
        fc.constantFrom(
            'Computer Science',
            'Information Technology',
            'Computer Engineering',
            'Financial Management',
            'Marketing Management',
        ),
        { nil: null }
    ),
    campus: fc.option(fc.constantFrom('Manila', 'Quezon City'), { nil: null }),
    status: fc.option(
        fc.constantFrom('Submitted', 'Pending', 'Competency Process', 'Enrolled', 'Graduated'),
        { nil: null }
    ),
    created_at: fc.option(
        fc.integer({ min: MIN_TS, max: MAX_TS }).map((ms) => new Date(ms).toISOString()),
        { nil: null }
    ),
    admin_remarks: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
});

const recordsArb = fc.array(applicationRecordArb, { minLength: 0, maxLength: 200 });

describe('Property 20: Report aggregation correctness', () => {
    it('counts summed across all status groups equal the total number of records', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const groups = aggregateByField(records, 'status');
                const summedCount = groups.reduce((acc, g) => acc + g.count, 0);
                expect(summedCount).toBe(records.length);
            }),
            { numRuns: 300 }
        );
    });

    it('counts summed across all campus groups equal the total number of records', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const groups = aggregateByField(records, 'campus');
                const summedCount = groups.reduce((acc, g) => acc + g.count, 0);
                expect(summedCount).toBe(records.length);
            }),
            { numRuns: 300 }
        );
    });

    it('counts summed across all degree_applied_for groups equal the total number of records', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const groups = aggregateByField(records, 'degree_applied_for');
                const summedCount = groups.reduce((acc, g) => acc + g.count, 0);
                expect(summedCount).toBe(records.length);
            }),
            { numRuns: 300 }
        );
    });

    it('each group count is a positive integer', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const groups = aggregateByField(records, 'status');
                for (const g of groups) {
                    expect(g.count).toBeGreaterThan(0);
                    expect(Number.isInteger(g.count)).toBe(true);
                }
            }),
            { numRuns: 200 }
        );
    });

    it('returns an empty array for an empty record set', () => {
        const groups = aggregateByField([], 'status');
        expect(groups).toEqual([]);
    });

    it('all group labels are non-empty strings', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const groups = aggregateByField(records, 'status');
                for (const g of groups) {
                    expect(typeof g.label).toBe('string');
                    expect(g.label.length).toBeGreaterThan(0);
                }
            }),
            { numRuns: 200 }
        );
    });
});
