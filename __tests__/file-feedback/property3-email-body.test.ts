// Feature: file-feedback, Property 3: Email body contains all required fields
// Validates: Requirements 3.2

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { buildFeedbackEmailBody } from "../../lib/utils/fileFeedbackUtils";

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
