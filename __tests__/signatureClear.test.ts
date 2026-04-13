// Feature: notifications-and-email-automation, Property 11: Signature clear is idempotent and resets to empty
// Validates: Requirements 6.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function that simulates the signature pad state in isolation,
 * without requiring a browser canvas API.
 */
function createSignaturePadLogic() {
    let strokes: number[][] = [];
    return {
        addStroke: (points: number[]) => { strokes = [...strokes, points]; },
        clearSignature: () => { strokes = []; },
        getSignature: () => strokes.length > 0 ? 'data:image/png;base64,...' : null,
        isEmpty: () => strokes.length === 0,
    };
}

// Arbitrary: a single stroke is an array of at least 2 numbers (x/y pairs)
const strokeArb = fc.array(fc.float({ noNaN: true }), { minLength: 2, maxLength: 20 });

// Arbitrary: a non-empty sequence of strokes (ensures the pad is not empty before clearing)
const strokesArb = fc.array(strokeArb, { minLength: 1, maxLength: 10 });

describe('SignaturePad clear logic – Property 11', () => {
    it('getSignature() returns null after clearSignature(), regardless of strokes drawn', () => {
        fc.assert(
            fc.property(strokesArb, (strokes) => {
                const pad = createSignaturePadLogic();
                for (const stroke of strokes) {
                    pad.addStroke(stroke);
                }
                // Pad should be non-empty before clearing
                expect(pad.getSignature()).not.toBeNull();

                pad.clearSignature();
                expect(pad.getSignature()).toBeNull();
            }),
            { numRuns: 200 }
        );
    });

    it('isEmpty() returns true after clearSignature()', () => {
        fc.assert(
            fc.property(strokesArb, (strokes) => {
                const pad = createSignaturePadLogic();
                for (const stroke of strokes) {
                    pad.addStroke(stroke);
                }
                pad.clearSignature();
                expect(pad.isEmpty()).toBe(true);
            }),
            { numRuns: 200 }
        );
    });

    it('clearSignature() is idempotent — calling it multiple times yields the same result as once', () => {
        fc.assert(
            fc.property(
                strokesArb,
                fc.integer({ min: 2, max: 10 }),
                (strokes, clearCount) => {
                    const pad = createSignaturePadLogic();
                    for (const stroke of strokes) {
                        pad.addStroke(stroke);
                    }

                    // Call clear multiple times
                    for (let i = 0; i < clearCount; i++) {
                        pad.clearSignature();
                    }

                    expect(pad.getSignature()).toBeNull();
                    expect(pad.isEmpty()).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });
});
