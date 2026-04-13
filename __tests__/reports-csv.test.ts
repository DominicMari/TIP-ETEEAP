// Feature: notifications-and-email-automation, Property 22: CSV export contains all required columns for every record
// Validates: Requirements 10.3

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateCSV, ApplicationRecord } from '../lib/utils/reportsUtils';

const REQUIRED_COLUMNS = [
    'applicant_name',
    'email_address',
    'degree_applied_for',
    'campus',
    'status',
    'created_at',
    'admin_remarks',
] as const;

const MIN_TS = 1577836800000; // 2020-01-01T00:00:00Z
const MAX_TS = 1924905600000; // 2031-01-01T00:00:00Z

/** Arbitrary that generates a minimal ApplicationRecord */
const applicationRecordArb = fc.record<ApplicationRecord>({
    application_id: fc.uuid(),
    applicant_name: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    email_address: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    degree_applied_for: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
    campus: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
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

const recordsArb = fc.array(applicationRecordArb, { minLength: 1, maxLength: 100 });

/**
 * Parses a CSV string into rows of cells, handling RFC 4180 quoting.
 * Correctly handles trailing empty cells (e.g. "a,,," → ["a","","",""]).
 */
function parseCSVLine(line: string): string[] {
    const cells: string[] = [];
    let i = 0;
    while (i <= line.length) {
        if (i === line.length) {
            // End of line — push empty cell only if we expect one (after a comma)
            // This is handled by the loop condition: we always push at least one cell
            break;
        }
        if (line[i] === '"') {
            // Quoted field
            let field = '';
            i++; // skip opening quote
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') {
                    field += '"';
                    i += 2;
                } else if (line[i] === '"') {
                    i++; // skip closing quote
                    break;
                } else {
                    field += line[i++];
                }
            }
            cells.push(field);
            if (line[i] === ',') i++; // skip comma after closing quote
        } else {
            // Unquoted field — read until next comma or end
            const end = line.indexOf(',', i);
            if (end === -1) {
                cells.push(line.slice(i));
                i = line.length;
            } else {
                cells.push(line.slice(i, end));
                i = end + 1;
                // If comma is the last character, there's a trailing empty cell
                if (i === line.length) {
                    cells.push('');
                    break;
                }
            }
        }
    }
    return cells;
}

function parseCSV(csv: string): string[][] {
    return csv.split('\n').map(parseCSVLine);
}

describe('Property 22: CSV export contains all required columns for every record', () => {
    it('the CSV header row contains all required column names in order', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const csv = generateCSV(records);
                const rows = parseCSV(csv);
                expect(rows.length).toBeGreaterThan(0);
                const header = rows[0];
                for (const col of REQUIRED_COLUMNS) {
                    expect(header).toContain(col);
                }
                // Columns appear in the specified order
                const indices = REQUIRED_COLUMNS.map((col) => header.indexOf(col));
                for (let i = 1; i < indices.length; i++) {
                    expect(indices[i]).toBeGreaterThan(indices[i - 1]);
                }
            }),
            { numRuns: 200 }
        );
    });

    it('the number of data rows equals the number of input records', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const csv = generateCSV(records);
                const rows = parseCSV(csv);
                // rows[0] is header; remaining rows are data
                expect(rows.length - 1).toBe(records.length);
            }),
            { numRuns: 200 }
        );
    });

    it('each data row has the same number of columns as the header', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const csv = generateCSV(records);
                const rows = parseCSV(csv);
                const headerLen = rows[0].length;
                for (let i = 1; i < rows.length; i++) {
                    expect(rows[i].length).toBe(headerLen);
                }
            }),
            { numRuns: 200 }
        );
    });

    it('each data row contains the corresponding field values from the record', () => {
        fc.assert(
            fc.property(recordsArb, (records) => {
                const csv = generateCSV(records);
                const rows = parseCSV(csv);
                const header = rows[0];

                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    const row = rows[i + 1]; // +1 to skip header

                    for (const col of REQUIRED_COLUMNS) {
                        const colIndex = header.indexOf(col);
                        expect(colIndex).toBeGreaterThanOrEqual(0);
                        const expectedValue = record[col] == null ? '' : String(record[col]);
                        expect(row[colIndex]).toBe(expectedValue);
                    }
                }
            }),
            { numRuns: 200 }
        );
    });

    it('values containing commas are properly escaped so the column count stays correct', () => {
        const records: ApplicationRecord[] = [
            {
                application_id: 'c1',
                applicant_name: 'Smith, John',
                email_address: 'john@example.com',
                degree_applied_for: 'Computer Science',
                campus: 'Manila',
                status: 'Enrolled',
                created_at: '2024-01-15T08:00:00.000Z',
                admin_remarks: 'Good standing, approved',
            },
        ];
        const csv = generateCSV(records);
        const rows = parseCSV(csv);
        expect(rows).toHaveLength(2); // header + 1 data row
        expect(rows[1]).toHaveLength(rows[0].length);
        const nameIdx = rows[0].indexOf('applicant_name');
        expect(rows[1][nameIdx]).toBe('Smith, John');
        const remarksIdx = rows[0].indexOf('admin_remarks');
        expect(rows[1][remarksIdx]).toBe('Good standing, approved');
    });

    it('values containing double-quotes are properly escaped', () => {
        const records: ApplicationRecord[] = [
            {
                application_id: 'c2',
                applicant_name: 'O\'Brien "The Great"',
                email_address: null,
                degree_applied_for: null,
                campus: null,
                status: null,
                created_at: null,
                admin_remarks: null,
            },
        ];
        const csv = generateCSV(records);
        const rows = parseCSV(csv);
        const nameIdx = rows[0].indexOf('applicant_name');
        expect(rows[1][nameIdx]).toBe('O\'Brien "The Great"');
    });

    it('returns only a header row for an empty record array', () => {
        const csv = generateCSV([]);
        const rows = parseCSV(csv);
        expect(rows).toHaveLength(1);
        for (const col of REQUIRED_COLUMNS) {
            expect(rows[0]).toContain(col);
        }
    });
});
