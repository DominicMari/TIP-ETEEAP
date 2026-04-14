// Feature: file-feedback, Property 5: Invalid sourceType is rejected
// Validates: Requirements 2.2

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// Use vi.hoisted so these are available inside vi.mock factory closures
const { mockFrom, mockGetServerSession, mockNextResponseJson } = vi.hoisted(() => {
    const mockFrom = vi.fn();
    const mockGetServerSession = vi.fn();
    const mockNextResponseJson = vi.fn((body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        body,
        json: async () => body,
    }));
    return { mockFrom, mockGetServerSession, mockNextResponseJson };
});

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("next-auth", () => ({
    getServerSession: mockGetServerSession,
}));

vi.mock("next/server", () => ({
    NextResponse: { json: mockNextResponseJson },
    NextRequest: vi.fn(),
}));

// Import route handler after mocks
import { POST } from "../../app/api/file-feedback/route";

// Helper: build a minimal NextRequest-like object
function makeRequest(body: Record<string, unknown>): Request {
    return {
        json: async () => body,
        url: "http://localhost:3000/api/file-feedback",
    } as unknown as Request;
}

// Valid base payload — sourceType will be overridden in each test
const validBase = {
    recordId: "some-record-id",
    fileName: "Tertiary: UP Diliman",
    message: "Please upload a clearer copy.",
    adminName: "Admin",
};

function setupDefaultMocks() {
    mockGetServerSession.mockResolvedValue({
        user: { name: "Admin", email: "admin@example.com" },
    });

    mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: {
                        application_id: "test-id",
                        file_feedback: [],
                        email_address: "applicant@example.com",
                        applicant_name: "Test Applicant",
                    },
                    error: null,
                }),
            }),
        }),
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        }),
    }));
}

describe("Property 5: Invalid sourceType is rejected", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Re-apply NextResponse.json mock after clearAllMocks
        mockNextResponseJson.mockImplementation((body: unknown, init?: { status?: number }) => ({
            status: init?.status ?? 200,
            body,
            json: async () => body,
        }));
        setupDefaultMocks();
    });

    it("rejects an empty string sourceType with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, sourceType: "" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects 'Application' (wrong case) with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, sourceType: "Application" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects 'Portfolio' (wrong case) with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, sourceType: "Portfolio" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects a random string sourceType with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, sourceType: "invalid-type" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("accepts 'application' with HTTP 200", async () => {
        const req = makeRequest({ ...validBase, sourceType: "application" });
        const res = await POST(req as any);
        expect(res.status).toBe(200);
    });

    it("accepts 'portfolio' with HTTP 200", async () => {
        const req = makeRequest({ ...validBase, sourceType: "portfolio" });
        const res = await POST(req as any);
        expect(res.status).toBe(200);
    });

    it("property: any string that is not 'application' or 'portfolio' always returns 400", async () => {
        const invalidSourceTypeArb = fc
            .string()
            .filter((s) => s !== "application" && s !== "portfolio");

        await fc.assert(
            fc.asyncProperty(invalidSourceTypeArb, async (sourceType) => {
                const req = makeRequest({ ...validBase, sourceType });
                const res = await POST(req as any);
                return res.status === 400;
            })
        );
    });

    it("property: invalid sourceType never triggers a DB update", async () => {
        const invalidSourceTypeArb = fc
            .string()
            .filter((s) => s !== "application" && s !== "portfolio");

        await fc.assert(
            fc.asyncProperty(invalidSourceTypeArb, async (sourceType) => {
                const updateSpy = vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                });

                mockFrom.mockImplementation(() => ({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    application_id: "test-id",
                                    file_feedback: [],
                                    email_address: "applicant@example.com",
                                    applicant_name: "Test Applicant",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    update: updateSpy,
                }));

                const req = makeRequest({ ...validBase, sourceType });
                const res = await POST(req as any);

                // Must return 400
                if (res.status !== 400) return false;

                // DB update must never be called for invalid sourceType
                if (updateSpy.mock.calls.length > 0) return false;

                return true;
            })
        );
    });
});
