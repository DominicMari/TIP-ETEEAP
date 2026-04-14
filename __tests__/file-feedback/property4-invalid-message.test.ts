// Feature: file-feedback, Property 4: Invalid message is rejected by the API
// Validates: Requirements 2.4, 2.5

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

// Valid base payload — message will be overridden in each test
const validBase = {
    sourceType: "application",
    recordId: "some-record-id",
    fileName: "Tertiary: UP Diliman",
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

describe("Property 4: Invalid message is rejected by the API", () => {
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

    it("rejects an empty string message with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, message: "" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects a whitespace-only message (spaces) with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, message: "   " });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects a whitespace-only message (tabs/newlines) with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, message: "\t\n\r" });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("rejects a message exceeding 2000 characters with HTTP 400", async () => {
        const req = makeRequest({ ...validBase, message: "a".repeat(2001) });
        const res = await POST(req as any);
        expect(res.status).toBe(400);
    });

    it("property: empty string message always returns 400", async () => {
        await fc.assert(
            fc.asyncProperty(fc.constant(""), async (message) => {
                const req = makeRequest({ ...validBase, message });
                const res = await POST(req as any);
                return res.status === 400;
            })
        );
    });

    it("property: whitespace-only message always returns 400", async () => {
        // Generate non-empty strings composed only of whitespace characters
        const whitespaceArb = fc.stringMatching(/^[ \t\n\r]+$/);
        await fc.assert(
            fc.asyncProperty(whitespaceArb, async (message) => {
                const req = makeRequest({ ...validBase, message });
                const res = await POST(req as any);
                return res.status === 400;
            })
        );
    });

    it("property: message longer than 2000 characters always returns 400", async () => {
        const longMessageArb = fc.string({ minLength: 2001, maxLength: 3000 });
        await fc.assert(
            fc.asyncProperty(longMessageArb, async (message) => {
                const req = makeRequest({ ...validBase, message });
                const res = await POST(req as any);
                return res.status === 400;
            })
        );
    });

    it("property: invalid message never triggers a DB update", async () => {
        const invalidMessageArb = fc.oneof(
            fc.constant(""),
            fc.stringMatching(/^[ \t\n\r]+$/),
            fc.string({ minLength: 2001, maxLength: 3000 })
        );

        await fc.assert(
            fc.asyncProperty(invalidMessageArb, async (message) => {
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

                const req = makeRequest({ ...validBase, message });
                const res = await POST(req as any);

                // Must return 400
                if (res.status !== 400) return false;

                // DB update must never be called for invalid messages
                if (updateSpy.mock.calls.length > 0) return false;

                return true;
            })
        );
    });
});
