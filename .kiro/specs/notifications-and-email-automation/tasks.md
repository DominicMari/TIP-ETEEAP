# Implementation Plan: Notifications and Email Automation

## Overview

Implement real-time in-app notifications, email automation, file validation, signature enforcement, admin remarks, applicant tracker polling, and report generation for the TIP ETEEAP system. All code is TypeScript/React (Next.js) using the existing Supabase and Resend infrastructure.

## Tasks

- [x] 1. Create the `notifications` Supabase table and utility functions
  - Run the SQL migration to create the `notifications` table with all required columns, RLS policies, and foreign key to `applications`
  - Create `lib/utils/formatElapsedTime.ts` implementing the elapsed time formatting rules
  - Create `lib/utils/validateFile.ts` implementing MIME type and file size validation
  - _Requirements: 2.3, 4.2, 5.1, 5.2_

  - [x] 1.1 Write property test for `formatElapsedTime` (Property 7)
    - **Property 7: Elapsed time formatting correctness**
    - Generate timestamps in each time bucket (< 60s, 1–59 min, 1–23 h, 1–6 days, ≥ 7 days) and assert the correct output format
    - **Validates: Requirements 4.2**

  - [x] 1.2 Write property test for `validateFile` — MIME type (Property 9)
    - **Property 9: File type validation accepts only allowed MIME types**
    - Generate random MIME type strings; assert `valid = true` only for the four accepted types
    - **Validates: Requirements 5.1, 5.3**

  - [x] 1.3 Write property test for `validateFile` — file size (Property 10)
    - **Property 10: File size validation enforces 10 MB limit**
    - Generate random file sizes; assert `valid = true` for ≤ 10,485,760 bytes and `valid = false` above
    - **Validates: Requirements 5.2, 5.3**

- [x] 2. Insert notification record on application submission
  - Modify `app/api/appform/route.ts` to insert a `notifications` row (`type: "new_application"`, `applicant_name`, `application_id`, `is_read: false`) after a successful `applications` insert, using the existing service-role Supabase client
  - Ensure notification insert failure does not block the submission success response (log to console only)
  - Update the confirmation email body to include applicant name, degree program, campus, and submission date per the branded template
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1_

  - [x] 2.1 Write property test for notification insertion (Property 3)
    - **Property 3: Notification insertion on submission**
    - For any successful submission, assert the `notifications` table contains a record with `type = "new_application"`, matching `applicant_name`, matching `application_id`, and `is_read = false`
    - **Validates: Requirements 2.1**

- [x] 3. Implement `useNotifications` hook
  - Create `app/admin/dashboard/useNotifications.ts`
  - Subscribe to the `notifications` table via Supabase Realtime on mount; fall back to 30-second polling if the subscription fails or is unavailable
  - Expose `notifications`, `unreadCount`, `markAsRead(id)`, `markAllAsRead()`, and `isLoading`
  - Fetch the 20 most recent notifications ordered by `created_at` descending on initial load
  - _Requirements: 2.2, 2.4, 3.4, 4.3, 4.4_

  - [x] 3.1 Write property test for `markAllAsRead` (Property 8)
    - **Property 8: Mark all as read sets all is_read to true**
    - Generate notification arrays with mixed `is_read` states; after `markAllAsRead`, assert every item has `is_read = true`
    - **Validates: Requirements 4.4**

  - [x] 3.2 Write property test for dropdown ordering and limit (Property 5)
    - **Property 5: Dropdown ordering and limit**
    - Generate random notification arrays; assert the hook returns at most 20 items ordered by `created_at` descending
    - **Validates: Requirements 3.4**

- [x] 4. Implement `NotificationBell` component
  - Create `app/admin/dashboard/NotificationBell.tsx` consuming `useNotifications`
  - Render a lucide `Bell` icon with a numeric unread badge (display "99+" when count > 99, no badge when count = 0)
  - Render a dropdown panel listing up to 20 notifications; each item shows applicant name, message, and `formatElapsedTime` output
  - Visually distinguish unread (highlighted background) from read notifications
  - On notification click: call `markAsRead(id)` then call `onNavigateToApplicant(application_id)`
  - Add "Mark all as read" button that calls `markAllAsRead()`
  - Show "No new notifications" when the list is empty
  - Close dropdown on outside click via `useEffect` with `mousedown` listener
  - Accept `onNavigateToApplicant: (applicationId: string) => void` prop
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.1 Write property test for unread badge display (Property 4)
    - **Property 4: Unread badge display**
    - Generate random integers N ≥ 0; assert badge shows N when 0 < N ≤ 99, "99+" when N > 99, and no badge when N = 0
    - **Validates: Requirements 3.2, 3.3**

  - [x] 4.2 Write property test for notification item rendering (Property 6)
    - **Property 6: Notification item renders all required fields**
    - For any notification with non-null `applicant_name` and `created_at`, assert the rendered item contains the name, a non-empty message, and a non-empty elapsed time string
    - **Validates: Requirements 4.1**

- [x] 5. Wire `NotificationBell` into the admin dashboard
  - Import and render `NotificationBell` in `app/admin/dashboard/page.tsx` inside the sidebar or header area, visible on all tabs
  - Pass an `onNavigateToApplicant` handler that calls `setActiveTab("Applicants")` and sets a `recordFocusRequest` for the given `application_id`
  - _Requirements: 3.1, 4.3_

- [x] 6. Checkpoint — Ensure all notification and bell tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add file upload validation to the application form
  - Import `validateFile` from `lib/utils/validateFile.ts` into the relevant application form step components (`app/appform/`)
  - Call `validateFile` on each file input's `onChange` event; display an inline error message adjacent to the input on failure
  - Prevent advancing to the next form step while any file input has a validation error
  - Display a green checkmark indicator adjacent to each file input that passes validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Enforce signature requirement on final submission step
  - Modify `app/appform/signature.tsx` (or the final step component) to disable the submit button when the signature canvas is empty
  - Display the error message "A signature is required to submit the application." if submission is attempted without a signature
  - Ensure the "Clear Signature" button resets the canvas and re-disables the submit button
  - On successful submission, upload the signature image to Supabase Storage and store the public URL in `applications.signature_url`
  - Display the signature image in the applicant's record in `applicantsmanage.tsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.1 Write property test for signature clear idempotency (Property 11)
    - **Property 11: Signature clear is idempotent and resets to empty**
    - Generate random signature strokes; after `clearSignature`, assert `getSignature()` returns `null`
    - **Validates: Requirements 6.5**

- [x] 9. Implement admin remarks management
  - In `app/admin/dashboard/applicantsmanage.tsx`, ensure the remarks textarea is pre-populated with `admin_remarks` from the applicant record
  - Verify `handleStatusChange` pre-populates the remarks field with the status-appropriate template from `getRemarksTemplate` (already partially implemented — confirm and complete)
  - Ensure saving remarks updates `admin_remarks` in the `applications` table
  - Confirm `sendStatusEmail` includes remarks in the email body when remarks are present
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.1 Write property test for remarks pre-population (Property 12)
    - **Property 12: Remarks pre-population from admin_remarks**
    - For any applicant record with non-null `admin_remarks`, assert the remarks input value equals `admin_remarks`
    - **Validates: Requirements 7.1**

  - [x] 9.2 Write property test for remarks round-trip persistence (Property 13)
    - **Property 13: Remarks round-trip persistence**
    - Generate random non-empty remarks strings; after saving, assert querying the `applications` table returns the same string in `admin_remarks`
    - **Validates: Requirements 7.2, 7.3**

  - [x] 9.3 Write property test for `getRemarksTemplate` totality (Property 14)
    - **Property 14: Status template mapping is total and non-empty**
    - Enumerate all five status values; assert `getRemarksTemplate(status)` returns a non-empty string for each
    - **Validates: Requirements 7.4**

- [x] 10. Add status change email automation
  - Verify `sendStatusEmail` in `applicantsmanage.tsx` sends emails for all notifiable statuses: "Pending", "Competency Process", "Enrolled", "Graduated"
  - Ensure each status uses its specific subject line and body template
  - Confirm email body includes applicant name, new status, and any admin remarks
  - Confirm failures are logged to `email_logs` and do not revert the status change
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.1 Write property test for status email coverage (Property 16)
    - **Property 16: Status email is sent for every notifiable status change**
    - For each of "Pending", "Competency Process", "Enrolled", "Graduated", assert the email service is called with the applicant's email and a status-specific subject
    - **Validates: Requirements 9.1, 9.2**

  - [x] 10.2 Write property test for status email body content (Property 17)
    - **Property 17: Status email body contains name, status, and remarks**
    - Generate random name/status/remarks combinations; assert the email body contains all three as substrings
    - **Validates: Requirements 9.3**

- [x] 11. Implement automatic status transition on View Details
  - Confirm `handleViewDetails` in `applicantsmanage.tsx` checks the current status before updating
  - Ensure only "Submitted" → "Pending" transition is applied; all other statuses are left unchanged
  - Ensure no manual UI control allows setting status to "Submitted" or "Pending" directly
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 11.1 Write property test for View Details auto-transition (Property 18)
    - **Property 18: View Details auto-transitions Submitted → Pending**
    - For any application with `status = "Submitted"`, after `handleViewDetails`, assert status in DB is "Pending"
    - **Validates: Requirements 11.2**

  - [x] 11.2 Write property test for View Details non-Submitted statuses (Property 19)
    - **Property 19: View Details does not change non-Submitted statuses**
    - For any application with status in {"Pending", "Competency Process", "Enrolled", "Graduated"}, after `handleViewDetails`, assert status is unchanged
    - **Validates: Requirements 11.3**

- [x] 12. Checkpoint — Ensure all form, remarks, email, and status tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add Supabase Realtime / polling to the applicant tracker page
  - Modify `app/tracker/page.tsx` to add a `useEffect` that sets up a Supabase Realtime subscription on the `applications` table filtered by the authenticated user's email
  - Fall back to a 30-second polling interval if Realtime is unavailable
  - Clean up the subscription/interval on component unmount
  - Display "No application found. Please complete and submit your application form." with a link to `/appform` when no application exists
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.1 Write property test for tracker status validity (Property 15)
    - **Property 15: Tracker status is always a valid enum value**
    - Generate random application records; assert the displayed status is always one of the five valid enum values
    - **Validates: Requirements 8.2**

- [x] 14. Implement the Reports component
  - Create `app/admin/dashboard/reports.tsx`
  - Query the `applications` table for aggregate counts grouped by `status`, `campus`, and `degree_applied_for`
  - Render summary cards and a `recharts` bar chart
  - Add date range filter inputs (start date, end date) that recalculate displayed data
  - Implement "Export as CSV": generate a CSV string client-side with columns `applicant_name`, `email_address`, `degree_applied_for`, `campus`, `status`, `created_at`, `admin_remarks`; trigger download via `URL.createObjectURL`
  - Implement "Export as PDF": use `window.print()` with a print-specific CSS class consistent with the existing `openPrintPreview` pattern
  - Show "No data available for the selected filters." and disable export buttons when filtered result is empty
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 14.1 Write property test for report aggregation correctness (Property 20)
    - **Property 20: Report aggregation correctness**
    - Generate random application collections; assert counts summed across all groups equal the total number of records
    - **Validates: Requirements 10.1**

  - [x] 14.2 Write property test for date range filter (Property 21)
    - **Property 21: Date range filter excludes out-of-range records**
    - Generate random date ranges and record sets; assert filtered results contain only records within `[start, end]`
    - **Validates: Requirements 10.2**

  - [x] 14.3 Write property test for CSV export structure (Property 22)
    - **Property 22: CSV export contains all required columns for every record**
    - Generate random applicant record arrays; assert the CSV has the correct header row and each data row contains the corresponding values
    - **Validates: Requirements 10.3**

- [x] 15. Wire Reports tab into the admin dashboard
  - Add a "Reports" tab entry to the `tabs` map in `app/admin/dashboard/page.tsx`
  - Import and register the `Reports` component so it renders when the Reports tab is active
  - _Requirements: 10.1_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Install `fast-check` for property-based tests: `npm install --save-dev fast-check`
- Each property test file should include the tag comment: `// Feature: notifications-and-email-automation, Property N: <title>`
- The `notifications` table SQL migration must be run in Supabase before any notification-related code is tested
- All email sending goes through `/api/send-email` to ensure consistent `email_logs` entries
- The `NotificationBell` component must be a `"use client"` component managing its own Realtime subscription lifecycle
