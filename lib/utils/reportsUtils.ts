// Pure utility functions for the Reports component — exported for testing.

export interface ApplicationRecord {
    application_id: string;
    applicant_name: string | null;
    email_address: string | null;
    degree_applied_for: string | null;
    campus: string | null;
    status: string | null;
    created_at: string | null;
    admin_remarks: string | null;
}

export interface AggregateGroup {
    label: string;
    count: number;
}

/**
 * Groups records by a given field and returns counts per unique value.
 * Records with a null/undefined/empty value for the field are grouped under "(Unknown)".
 */
export function aggregateByField(
    records: ApplicationRecord[],
    field: keyof ApplicationRecord
): AggregateGroup[] {
    const counts: Record<string, number> = {};
    for (const record of records) {
        const raw = record[field];
        const label = raw != null && raw !== "" ? String(raw) : "(Unknown)";
        counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

/**
 * Filters records to those whose created_at falls within [start, end] (inclusive).
 * Records with a null created_at are excluded when either bound is provided.
 * start and end are expected as YYYY-MM-DD strings.
 */
export function filterByDateRange(
    records: ApplicationRecord[],
    start: string | null,
    end: string | null
): ApplicationRecord[] {
    if (!start && !end) return records;
    return records.filter((r) => {
        if (!r.created_at) return false;
        const ts = new Date(r.created_at).getTime();
        if (isNaN(ts)) return false;
        if (start) {
            const startTs = new Date(start).getTime();
            if (!isNaN(startTs) && ts < startTs) return false;
        }
        if (end) {
            // Make end inclusive by treating it as end-of-day UTC
            const endTs = new Date(end + 'T23:59:59.999Z').getTime();
            if (!isNaN(endTs) && ts > endTs) return false;
        }
        return true;
    });
}

/**
 * Generates a CSV string from an array of application records.
 * Escapes commas and double-quotes per RFC 4180.
 */
export function generateCSV(records: ApplicationRecord[]): string {
    const COLUMNS: (keyof ApplicationRecord)[] = [
        "applicant_name",
        "email_address",
        "degree_applied_for",
        "campus",
        "status",
        "created_at",
        "admin_remarks",
    ];

    const escapeCell = (value: string | null | undefined): string => {
        const str = value == null ? "" : String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = COLUMNS.join(",");
    const rows = records.map((r) =>
        COLUMNS.map((col) => escapeCell(r[col] as string | null)).join(",")
    );
    return [header, ...rows].join("\n");
}
