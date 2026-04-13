// Feature: notifications-and-email-automation, Property 6: Notification item renders all required fields
// Validates: Requirements 4.1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatNotificationItem } from '../app/admin/dashboard/notificationUtils';

const MIN_TS = new Date('2020-01-01').getTime();
const MAX_TS = new Date('2030-01-01').getTime();

// Arbitrary for a notification with non-null applicant_name and valid created_at
const notificationArb = fc.record({
    applicant_name: fc.string({ minLength: 1, maxLength: 80 }),
    created_at: fc
        .integer({ min: MIN_TS, max: MAX_TS })
        .map((ms) => new Date(ms).toISOString()),
});

describe('Property 6: Notification item renders all required fields', () => {
    it('returns a non-empty name for any non-null applicant_name', () => {
        fc.assert(
            fc.property(notificationArb, (notification) => {
                const { name } = formatNotificationItem(notification);
                expect(name.length).toBeGreaterThan(0);
            }),
            { numRuns: 200 }
        );
    });

    it('returns a non-empty message string for any notification', () => {
        fc.assert(
            fc.property(notificationArb, (notification) => {
                const { message } = formatNotificationItem(notification);
                expect(message.length).toBeGreaterThan(0);
            }),
            { numRuns: 200 }
        );
    });

    it('returns a non-empty elapsed time string for any valid created_at', () => {
        fc.assert(
            fc.property(notificationArb, (notification) => {
                const { elapsedTime } = formatNotificationItem(notification);
                expect(elapsedTime.length).toBeGreaterThan(0);
            }),
            { numRuns: 200 }
        );
    });

    it('name matches the applicant_name from the notification', () => {
        fc.assert(
            fc.property(notificationArb, (notification) => {
                const { name } = formatNotificationItem(notification);
                expect(name).toBe(notification.applicant_name);
            }),
            { numRuns: 200 }
        );
    });

    it('message is always "has submitted an application"', () => {
        fc.assert(
            fc.property(notificationArb, (notification) => {
                const { message } = formatNotificationItem(notification);
                expect(message).toBe('has submitted an application');
            }),
            { numRuns: 200 }
        );
    });

    it('falls back to "Unknown Applicant" when applicant_name is null', () => {
        const { name } = formatNotificationItem({ applicant_name: null, created_at: new Date().toISOString() });
        expect(name).toBe('Unknown Applicant');
    });
});
