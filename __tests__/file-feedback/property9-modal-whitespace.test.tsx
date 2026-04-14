// @vitest-environment jsdom
// Feature: file-feedback, Property 9: FileFeedbackModal rejects whitespace-only messages client-side
// Validates: Requirements 6.3

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import FileFeedbackModal from "../../components/admin/FileFeedbackModal";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    fileName: "test.pdf",
    sourceType: "application" as const,
    recordId: "123",
    adminName: "Admin",
    onSuccess: vi.fn(),
};

describe("Property 9: FileFeedbackModal rejects whitespace-only messages client-side", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, entry: {} }),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("property: whitespace-only message shows validation error and does not call fetch", async () => {
        const whitespaceArb = fc.stringMatching(/^[ \t\n\r]+$/);

        await fc.assert(
            fc.asyncProperty(whitespaceArb, async (whitespaceMessage) => {
                const { unmount } = render(<FileFeedbackModal {...defaultProps} />);

                const textarea = screen.getByRole("textbox");
                fireEvent.change(textarea, { target: { value: whitespaceMessage } });

                const submitButton = screen.getByRole("button", { name: /submit feedback/i });
                await act(async () => {
                    fireEvent.click(submitButton);
                });

                // Validation error must be visible
                const errorVisible = screen.queryByText(/feedback message cannot be empty/i) !== null;

                // fetch must NOT have been called
                const fetchNotCalled = mockFetch.mock.calls.length === 0;

                unmount();
                vi.clearAllMocks();

                return errorVisible && fetchNotCalled;
            }),
            { numRuns: 50 }
        );
    });

    it("example: single space shows validation error and does not call fetch", async () => {
        render(<FileFeedbackModal {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        fireEvent.change(textarea, { target: { value: " " } });

        const submitButton = screen.getByRole("button", { name: /submit feedback/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(screen.getByText(/feedback message cannot be empty/i)).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("example: tabs and newlines show validation error and do not call fetch", async () => {
        render(<FileFeedbackModal {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        fireEvent.change(textarea, { target: { value: "\t\n\r" } });

        const submitButton = screen.getByRole("button", { name: /submit feedback/i });
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(screen.getByText(/feedback message cannot be empty/i)).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
