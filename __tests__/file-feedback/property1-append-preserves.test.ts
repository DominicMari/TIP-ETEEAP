// Feature: file-feedback, Property 1: Feedback entry is appended, not replaced
// Validates: Requirements 10.1, 10.2, 10.3, 1.3, 10.4

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { appendFeedbackEntry } from "../../lib/utils/fileFeedbackUtils";
import type { FileFeedbackEntry } from "../../lib/types/fileFeedback";

const entryArb = fc.record({
    fileName: fc.string({ minLength: 1 }),
    message: fc.string({ minLength: 1 }),
    adminName: fc.string({ minLength: 1 }),
    createdAt: fc.integer({ min: 0, max: 4102444800000 }).map((ms) => new Date(ms).toISOString()),
});

describe("Property 1: Feedback entry is appended, not replaced", () => {
    it("non-empty existing array: result has length N+1, all originals preserved, new entry is last", () => {
        fc.assert(
            fc.property(
                fc.array(entryArb, { minLength: 1 }),
                entryArb,
                (existing: FileFeedbackEntry[], newEntry: FileFeedbackEntry) => {
                    const result = appendFeedbackEntry(existing, newEntry);

                    expect(result.length).toBe(existing.length + 1);

                    for (let i = 0; i < existing.length; i++) {
                        expect(result[i]).toEqual(existing[i]);
                    }

                    expect(result[result.length - 1]).toEqual(newEntry);
                }
            )
        );
    });

    it("empty existing array: result has length 1, new entry is the only element", () => {
        fc.assert(
            fc.property(entryArb, (newEntry: FileFeedbackEntry) => {
                const result = appendFeedbackEntry([], newEntry);
                expect(result.length).toBe(1);
                expect(result[0]).toEqual(newEntry);
            })
        );
    });

    it("null existing: treated as empty array, result has length 1", () => {
        fc.assert(
            fc.property(entryArb, (newEntry: FileFeedbackEntry) => {
                const result = appendFeedbackEntry(null, newEntry);
                expect(result.length).toBe(1);
                expect(result[0]).toEqual(newEntry);
            })
        );
    });

    it("undefined existing: treated as empty array, result has length 1", () => {
        fc.assert(
            fc.property(entryArb, (newEntry: FileFeedbackEntry) => {
                const result = appendFeedbackEntry(undefined, newEntry);
                expect(result.length).toBe(1);
                expect(result[0]).toEqual(newEntry);
            })
        );
    });
});
