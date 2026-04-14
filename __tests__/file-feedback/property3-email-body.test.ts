// Feature: file-feedback, Property 3: Email body contains all required fields
// Validates: Requirements 3.2

import { describe, it, vi } from "vitest";
import * as fc from "fast-check";

// Mock Supabase so the module-level createClient call doesn't fail at import time
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("next/server", () => ({
    NextResponse: { json: vi.fn() },
    NextRequest: vi.fn(),
}));

import { buildFeedbackEmailBody } from "../../app/api/file-feedback/route";

describe("Property 3: Email body contains all required fields", () => {
    it("email body contains fileName, message, and applicantName (or 'Applicant' when null)", () => {
        fc.assert(
            fc.property(
                fc.option(fc.string({ minLength: 1 }), { nil: null }),
                fc.string({ minLength: 1 }),
                fc.string({ minLength: 1 }),
                (applicantName: string | null, fileName: string, message: string) => {
                    const body = buildFeedbackEmailBody(applicantName, fileName, message);
                    const expectedName = applicantName ?? "Applicant";
                    return (
                        body.includes(fileName) &&
                        body.includes(message) &&
                        body.includes(expectedName)
                    );
                }
            )
        );
    });
});
