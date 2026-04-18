"use client";

import { useEffect, useState, useCallback } from "react";
import supabase from "../../../lib/supabase/client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    aggregateByField,
    filterByDateRange,
    generateCSV,
    type ApplicationRecord,
    type AggregateGroup,
} from "../../../lib/utils/reportsUtils";

// Re-export so consumers can import from this file
export type { ApplicationRecord, AggregateGroup };
export { aggregateByField, filterByDateRange, generateCSV };

// ─── Reports Component ────────────────────────────────────────────────────────

export default function Reports() {
    const [allRecords, setAllRecords] = useState<ApplicationRecord[]>([]);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all application records once
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from("applications")
                .select(
                    "application_id, applicant_name, email_address, degree_applied_for, campus, status, created_at, admin_remarks"
                )
                .order("created_at", { ascending: false });

            if (fetchError) {
                setError(fetchError.message);
            } else {
                setAllRecords((data as ApplicationRecord[]) ?? []);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Apply date range filter
    const filtered = filterByDateRange(
        allRecords,
        startDate || null,
        endDate || null
    );

    const isEmpty = filtered.length === 0;

    // Aggregations
    const byStatus = aggregateByField(filtered, "status");
    const byCampus = aggregateByField(filtered, "campus");
    const byDegree = aggregateByField(filtered, "degree_applied_for");

    // ── CSV Export ──────────────────────────────────────────────────────────────
    const handleExportCSV = useCallback(() => {
        if (isEmpty) return;
        const csv = generateCSV(filtered);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "applicants_report.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [filtered, isEmpty]);

    // ── PDF Export ──────────────────────────────────────────────────────────────
    const handleExportPDF = useCallback(() => {
        if (isEmpty) return;

        const dateRange = startDate || endDate
            ? `${startDate ? new Date(startDate).toLocaleDateString("en-PH") : "—"} to ${endDate ? new Date(endDate).toLocaleDateString("en-PH") : "—"}`
            : "All dates";

        const tableRows = filtered.map((r) => `
            <tr>
                <td>${r.applicant_name ?? ""}</td>
                <td>${r.email_address ?? ""}</td>
                <td>${r.degree_applied_for ?? ""}</td>
                <td>${r.campus ?? ""}</td>
                <td>${r.status ?? ""}</td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH") : ""}</td>
                <td>${r.admin_remarks ?? ""}</td>
            </tr>`).join("");

        const summaryRows = [
            { label: "Total Applicants", value: filtered.length },
            { label: "Unique Campuses", value: byCampus.length },
            { label: "Degree Programs", value: byDegree.length },
        ].map(s => `<div class="summary-card"><div class="summary-label">${s.label}</div><div class="summary-value">${s.value}</div></div>`).join("");

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Applicant Reports – TIP ETEEAP</title>
  <style>
    @page { size: A4; margin: 12mm 14mm 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 9pt; line-height: 1.3; }

    /* ── Header ── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
    .page-header-left { display: flex; gap: 8px; align-items: center; }
    .page-header-left img { width: 50px; height: 50px; object-fit: contain; }
    .page-header-left .school-name { font-size: 10pt; font-weight: bold; line-height: 1.3; }
    .page-header-right { text-align: right; font-size: 7pt; font-weight: bold; letter-spacing: 1.5px; }
    .page-header-right span { font-weight: normal; font-style: italic; letter-spacing: 0; font-size: 6.5pt; display: block; }
    .eteeap-title { text-align: center; font-size: 9.5pt; font-weight: bold; margin-bottom: 8px; }
    .divider { border: none; border-top: 1.5px solid #000; margin: 6px 0 10px; }

    /* ── Report title ── */
    .report-title { font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 2px; }
    .report-subtitle { font-size: 9pt; text-align: center; color: #444; margin-bottom: 10px; }

    /* ── Summary cards ── */
    .summary-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .summary-card { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 8px; text-align: center; }
    .summary-label { font-size: 8pt; color: #555; margin-bottom: 2px; }
    .summary-value { font-size: 18pt; font-weight: bold; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-top: 8px; }
    th { background: #f3f4f6; border: 1px solid #000; padding: 4px 5px; text-align: left; font-weight: bold; }
    td { border: 1px solid #ccc; padding: 3px 5px; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
  </style>
</head>
<body>

<!-- PAGE HEADER (same as printTemplate) -->
<div class="page-header">
  <div class="page-header-left">
    <img src="/assets/NewTIPLogo.png" alt="TIP" onerror="this.style.display='none'" />
    <div class="school-name">TECHNOLOGICAL<br/>INSTITUTE OF THE<br/>PHILIPPINES</div>
  </div>
</div>

<div class="eteeap-title">
  Expanded Tertiary Education Equivalency and Accreditation Program (ETEEAP)
</div>

<hr class="divider"/>

<!-- REPORT TITLE -->
<div class="report-title">Applicant Reports</div>
<div class="report-subtitle">Date Range: ${dateRange} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>

<!-- SUMMARY -->
<div class="summary-row">${summaryRows}</div>

<!-- DATA TABLE -->
<table>
  <thead>
    <tr>
      <th>Applicant Name</th>
      <th>Email</th>
      <th>Degree</th>
      <th>Campus</th>
      <th>Status</th>
      <th>Submitted</th>
      <th>Remarks</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>

<script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(html);
        win.document.close();
    }, [filtered, isEmpty, startDate, endDate, byCampus.length, byDegree.length]);

    // ── Render ──────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-gray-500">
                Loading report data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
                Failed to load report data: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6 reports-printable">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <h3 className="text-lg font-semibold text-gray-800">
                    Applicant Reports
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date range filters */}
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        From
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        To
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </label>
                    {/* Export buttons */}
                    <button
                        onClick={handleExportCSV}
                        disabled={isEmpty}
                        className="px-4 py-1.5 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Export as CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isEmpty}
                        className="px-4 py-1.5 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Export as PDF
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {isEmpty ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                    No data available for the selected filters.
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard title="Total Applicants" value={filtered.length} />
                        <SummaryCard title="Unique Campuses" value={byCampus.length} />
                        <SummaryCard title="Degree Programs" value={byDegree.length} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Applicants by Status" data={byStatus} color="#f59e0b" />
                        <ChartCard title="Applicants by Campus" data={byCampus} color="#3b82f6" />
                    </div>
                    <ChartCard title="Applicants by Degree Program" data={byDegree} color="#10b981" />

                    {/* Data table (visible in print) */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    {[
                                        "Applicant Name",
                                        "Email",
                                        "Degree",
                                        "Campus",
                                        "Status",
                                        "Submitted",
                                        "Remarks",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.application_id} className="even:bg-gray-50">
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.applicant_name ?? ""}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.email_address ?? ""}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.degree_applied_for ?? ""}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.campus ?? ""}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.status ?? ""}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH") : ""}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-1 text-gray-900">{r.admin_remarks ?? ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

function ChartCard({
    title,
    data,
    color,
}: {
    title: string;
    data: AggregateGroup[];
    color: string;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={color} name="Count" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
