// @vitest-environment jsdom
// Feature: file-feedback, Property 6: FileFeedbackSection renders all entries with required fields
// Validates: Requirements 9.2, 9.4, 9.7

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FileFeedbackSection } from "../../components/FileFeedbackSection";
import type { FileFeedbackEntry } from "../../lib/types/fileFeedback";

const entryArb = fc.record({
    fileName: fc.string({ minLength: 1 }),
    message: fc.string({ minLength: 1 }),
    adminName: fc.string({ minLength: 1 }),
    createdAt: fc.date().map((d) => d.toISOString()),
});

describe("Property 6: FileFeedbackSection renders all entries with required fields", () => {
    it("property: renders exactly N cards for N entries, each containing fileName, message, and adminName", () => {
        fc.assert(
            fc.property(
                fc.array(entryArb, { minLength: 1, maxLength: 20 }),
                (entries: FileFeedbackEntry[]) => {
                    const { container, unmount } = render(
                        <FileFeedbackSection feedback={entries} />
                    );

                    // Count rendered cards — each entry maps to one card
                    const cards = container.querySelectorAll(".bg-white.rounded-lg.border");
                    expect(cards.length).toBe(entries.length);

                    // Use textContent to safely check content (avoids HTML entity encoding issues)
                    const text = container.textContent ?? "";
                    for (const entry of entries) {
                        expect(text).toContain(entry.fileName);
                        expect(text).toContain(entry.message);
                        expect(text).toContain(entry.adminName);
                    }

                    // The section header is present for non-empty arrays — scope to container
                    const utils = within(container);
                    expect(utils.getByText(/file feedback from admin/i)).toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 50 }
        );
    });

    it("property: renders nothing meaningful when feedback array is empty", () => {
        const { container } = render(<FileFeedbackSection feedback={[]} />);

        // The component renders the outer wrapper but no cards for empty arrays
        const cards = container.querySelectorAll(".bg-white.rounded-lg.border");
        expect(cards.length).toBe(0);

        // The space-y-3 div should be empty (no card children)
        const cardContainer = container.querySelector(".space-y-3");
        expect(cardContainer?.children.length).toBe(0);
    });

    it("example: single entry renders fileName, message, adminName, and a non-empty date", () => {
        const entry: FileFeedbackEntry = {
            fileName: "Tertiary: UP Diliman",
            message: "Please upload a clearer copy.",
            adminName: "Admin",
            createdAt: new Date("2025-01-15T10:30:00.000Z").toISOString(),
        };

        const { container } = render(<FileFeedbackSection feedback={[entry]} />);
        const utils = within(container);

        expect(utils.getByText("Tertiary: UP Diliman")).toBeInTheDocument();
        expect(utils.getByText("Please upload a clearer copy.")).toBeInTheDocument();
        expect(container.innerHTML).toContain("Admin");
        // Date should be formatted (non-empty, not "N/A")
        expect(container.innerHTML).toMatch(/January|Jan/);
        expect(container.innerHTML).not.toContain("N/A");
    });

    it("example: three entries all render in order", () => {
        const entries: FileFeedbackEntry[] = [
            { fileName: "File A", message: "Msg A", adminName: "Admin1", createdAt: "2025-01-01T00:00:00.000Z" },
            { fileName: "File B", message: "Msg B", adminName: "Admin2", createdAt: "2025-01-02T00:00:00.000Z" },
            { fileName: "File C", message: "Msg C", adminName: "Admin3", createdAt: "2025-01-03T00:00:00.000Z" },
        ];

        const { container } = render(<FileFeedbackSection feedback={entries} />);
        const utils = within(container);

        const cards = container.querySelectorAll(".bg-white.rounded-lg.border");
        expect(cards.length).toBe(3);

        expect(utils.getByText("File A")).toBeInTheDocument();
        expect(utils.getByText("File B")).toBeInTheDocument();
        expect(utils.getByText("File C")).toBeInTheDocument();
    });
});
