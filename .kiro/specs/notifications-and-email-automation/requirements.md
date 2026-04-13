# Requirements Document

## Introduction

This feature adds automated email notifications and a real-time in-app notification system to the TIP ETEEAP student applicant management system. When an applicant submits their application form, they receive a confirmation email and the admin dashboard is notified in real time. Admins can view a notification bell icon in the dashboard header/sidebar that shows a dropdown list of recent applicant submissions with elapsed time indicators. The feature also covers file submission validation with remarks, signature confirmation, applicant status monitoring, and report generation.

## Glossary

- **System**: The TIP ETEEAP student applicant management web application built with Next.js and Supabase.
- **Applicant**: A student who has registered and is filling out or has submitted an application form.
- **Admin**: An authenticated administrator who manages applicant records through the admin dashboard.
- **Notification**: An in-app alert stored in Supabase and displayed in the admin dashboard indicating a new applicant submission or status-relevant event.
- **Notification_Bell**: The bell icon UI component rendered in the admin dashboard header that shows unread notification count and a dropdown list of recent notifications.
- **Email_Service**: The existing Resend-based email sending service at `app/api/send-email/route.ts` and `lib/emailService.ts`.
- **Confirmation_Email**: An automated email sent to an applicant immediately after a successful application submission.
- **Status_Email**: An automated email sent to an applicant when an admin changes the applicant's application status.
- **Elapsed_Time**: A human-readable relative time string (e.g., "2 hours ago", "3 days ago") computed from the notification's `created_at` timestamp.
- **File_Submission**: Any uploaded file attached to an application or portfolio form (photo, credential files, signature, portfolio documents).
- **Remarks**: Admin-authored text notes attached to an application record, visible to the applicant on the tracker page.
- **Signature**: A drawn digital signature captured via the signature canvas on the final step of the application form.
- **Application_Tracker**: The page at `app/tracker/` where applicants can monitor their application status and admin remarks.
- **Report**: A generated summary of applicant data (counts by status, campus, degree program) exportable from the admin dashboard.
- **View_Details**: The action of an admin opening an applicant's full record via the "View Details" button in the Applicants Management tab, which triggers an automatic status transition from "Submitted" to "Pending".

---

## Requirements

### Requirement 1: Applicant Submission Confirmation Email

**User Story:** As an applicant, I want to receive a confirmation email immediately after I submit my application, so that I know my submission was received successfully.

#### Acceptance Criteria

1. WHEN an applicant successfully submits the application form, THE Email_Service SHALL send a confirmation email to the applicant's registered email address within 30 seconds of submission.
2. WHEN the confirmation email is sent, THE Email_Service SHALL use the existing branded `EmailTemplate` component with the subject "Application Received – TIP ETEEAP".
3. WHEN the confirmation email is sent, THE Email_Service SHALL include the applicant's name, the degree program applied for, the campus, and the application submission date in the email body.
4. IF the Email_Service fails to send the confirmation email, THEN THE System SHALL log the failure to the `email_logs` table with status "Failed" and SHALL NOT block the applicant's submission success response.
5. THE Email_Service SHALL record every confirmation email attempt in the `email_logs` Supabase table with recipient, subject, status, and timestamp fields.

---

### Requirement 2: Admin Dashboard Real-Time Notification on New Submission

**User Story:** As an admin, I want the dashboard to notify me immediately when a new applicant submits an application, so that I can act on it promptly without manually refreshing.

#### Acceptance Criteria

1. WHEN an applicant successfully submits the application form, THE System SHALL insert a new record into a `notifications` Supabase table containing: `id`, `type` ("new_application"), `applicant_name`, `application_id`, `created_at`, and `is_read` (default false).
2. WHILE an admin is viewing the dashboard, THE Notification_Bell SHALL reflect new unread notifications within 5 seconds of the submission event using Supabase Realtime subscriptions.
3. THE System SHALL maintain a `notifications` table in Supabase with columns: `id` (uuid, primary key), `type` (text), `applicant_name` (text), `application_id` (uuid, foreign key to `applications`), `created_at` (timestamptz, default now()), `is_read` (boolean, default false).
4. IF the Supabase Realtime subscription is unavailable, THEN THE Notification_Bell SHALL fall back to polling the `notifications` table every 30 seconds.

---

### Requirement 3: Notification Bell Icon in Admin Dashboard

**User Story:** As an admin, I want a notification bell icon in the dashboard header, so that I can quickly see and access new applicant submission alerts.

#### Acceptance Criteria

1. THE Notification_Bell SHALL be rendered in the admin dashboard header area, visible on all dashboard tabs without requiring a page reload.
2. WHEN there are unread notifications, THE Notification_Bell SHALL display a numeric badge showing the count of unread notifications (capped at display "99+" for counts above 99).
3. WHEN there are no unread notifications, THE Notification_Bell SHALL display no badge.
4. WHEN an admin clicks the Notification_Bell, THE System SHALL display a dropdown panel listing the 20 most recent notifications ordered by `created_at` descending.
5. WHEN the dropdown is open and the admin clicks outside of it, THE System SHALL close the dropdown.
6. WHILE the dropdown is open, THE System SHALL visually distinguish unread notifications from read notifications (e.g., unread items have a highlighted background).

---

### Requirement 4: Notification Dropdown Content and Elapsed Time

**User Story:** As an admin, I want each notification in the dropdown to show the applicant's name and how long ago they submitted, so that I can prioritize recent submissions.

#### Acceptance Criteria

1. WHEN the notification dropdown is displayed, THE Notification_Bell SHALL render each notification item showing: applicant name, notification message (e.g., "has submitted an application"), and the Elapsed_Time since submission.
2. THE System SHALL compute Elapsed_Time using the following rules: less than 60 seconds displays "just now"; 1–59 minutes displays "X minute(s) ago"; 1–23 hours displays "X hour(s) ago"; 1–6 days displays "X day(s) ago"; 7 or more days displays the formatted date (e.g., "Jan 5, 2025").
3. WHEN an admin clicks a notification item in the dropdown, THE System SHALL mark that notification as read (set `is_read` to true in the `notifications` table) and SHALL navigate the admin to the Applicants tab with the corresponding applicant record focused.
4. WHEN the admin clicks "Mark all as read" in the dropdown, THE System SHALL set `is_read` to true for all notifications belonging to the current admin session's scope.
5. THE Notification_Bell dropdown SHALL display a "No new notifications" message WHEN the notifications list is empty.

---

### Requirement 5: Application Form File Submission Validation

**User Story:** As an applicant, I want the application form to validate my uploaded files before submission, so that I am informed of any invalid files before they are rejected.

#### Acceptance Criteria

1. WHEN an applicant uploads a file in the application form, THE System SHALL validate that the file type is one of the accepted MIME types: `image/jpeg`, `image/png`, `image/gif`, `application/pdf`.
2. WHEN an applicant uploads a file in the application form, THE System SHALL validate that the file size does not exceed 10 MB per file.
3. IF an uploaded file fails type or size validation, THEN THE System SHALL display an inline error message adjacent to the file input field identifying the specific validation failure (invalid type or size exceeded) before the applicant can proceed to the next step.
4. IF an uploaded file fails validation, THEN THE System SHALL prevent the applicant from advancing to the next form step until the invalid file is replaced or removed.
5. WHEN all uploaded files pass validation, THE System SHALL display a visual confirmation indicator (e.g., a green checkmark) adjacent to each validated file input.

---

### Requirement 6: Signature Confirmation on Application Submission

**User Story:** As an applicant, I want to be required to provide my digital signature before submitting, so that my submission is formally acknowledged.

#### Acceptance Criteria

1. WHEN an applicant reaches the final submission step, THE System SHALL display the signature canvas and require a drawn signature before enabling the submit button.
2. IF an applicant attempts to submit without drawing a signature, THEN THE System SHALL display an error message "A signature is required to submit the application." and SHALL prevent form submission.
3. WHEN an applicant draws a valid signature and submits, THE System SHALL upload the signature image to Supabase Storage and store the public URL in the `applications` table `signature_url` column.
4. WHEN the signature is successfully saved, THE System SHALL display the signature image in the applicant's application record visible to the admin in the Applicants Management tab.
5. THE System SHALL provide a "Clear Signature" button that allows the applicant to erase and redraw the signature before submission.

---

### Requirement 7: Admin Remarks on File Submissions

**User Story:** As an admin, I want to add remarks to each applicant's file submission, so that I can communicate specific feedback or instructions about their submitted documents.

#### Acceptance Criteria

1. WHEN an admin views an applicant's record in the Applicants Management tab, THE System SHALL display a remarks input field pre-populated with any existing `admin_remarks` value from the `applications` table.
2. WHEN an admin saves remarks for an applicant, THE System SHALL update the `admin_remarks` column in the `applications` table for that record.
3. WHEN admin remarks are saved, THE System SHALL display the updated remarks on the applicant's Application_Tracker page.
4. WHEN an admin changes an applicant's status, THE System SHALL pre-populate the remarks field with a status-appropriate template text that the admin can edit before saving.
5. WHEN remarks are updated, THE System SHALL send a Status_Email to the applicant notifying them that their application has been reviewed and remarks are available on the tracker.

---

### Requirement 8: Applicant Status Monitoring on Tracker Page

**User Story:** As an applicant, I want to view my current application status and any admin remarks on the tracker page, so that I can stay informed about my application progress.

#### Acceptance Criteria

1. WHEN an authenticated applicant visits the Application_Tracker page, THE System SHALL fetch and display the applicant's current application status from the `applications` table.
2. THE System SHALL display the status using one of the following values: "Submitted", "Pending", "Competency Process", "Enrolled", "Graduated".
3. WHEN admin remarks exist for the applicant's record, THE System SHALL display the remarks text on the tracker page below the status indicator.
4. WHEN the applicant's status is updated (whether automatically via View_Details or manually by an admin), THE Application_Tracker SHALL reflect the new status within 60 seconds of the update (via polling or Supabase Realtime).
5. IF the applicant has no submitted application, THEN THE Application_Tracker SHALL display a message "No application found. Please complete and submit your application form." with a link to the application form.

---

### Requirement 9: Status Change Email Automation

**User Story:** As an admin, I want the system to automatically send an email to the applicant whenever their application status changes, so that applicants are kept informed without manual effort.

#### Acceptance Criteria

1. WHEN an applicant's status changes to "Pending" (triggered automatically by View_Details) or when an admin manually updates the status to "Competency Process", "Enrolled", or "Graduated", THE Email_Service SHALL automatically send a Status_Email to the applicant's registered email address.
2. THE Email_Service SHALL use status-specific email templates for each of the following statuses: "Pending", "Competency Process", "Enrolled", "Graduated".
3. WHEN a Status_Email is sent, THE Email_Service SHALL include the applicant's name, the new status, and any admin remarks in the email body.
4. IF the Email_Service fails to send a Status_Email, THEN THE System SHALL log the failure in the `email_logs` table and SHALL NOT revert the status change.
5. THE Email_Service SHALL record every Status_Email attempt in the `email_logs` table with recipient, subject, status ("Sent" or "Failed"), and timestamp.

---

### Requirement 11: Automatic Status Transition on Admin View

**User Story:** As an admin, I want the system to automatically mark an application as "Pending" when I open it via View Details, so that the status accurately reflects whether the application has been reviewed without requiring manual updates.

#### Acceptance Criteria

1. WHEN an admin clicks the "View Details" button for an applicant record in the Applicants Management tab, THE System SHALL check the current status of that application.
2. WHEN the current status is "Submitted" and an admin performs View_Details, THE System SHALL automatically update the `status` column in the `applications` table to "Pending".
3. WHEN the status is already "Pending", "Competency Process", "Enrolled", or "Graduated", THE System SHALL NOT change the status when the admin performs View_Details.
4. WHEN the status transitions from "Submitted" to "Pending" via View_Details, THE Application_Tracker SHALL reflect the updated "Pending" status within 60 seconds.
5. THE System SHALL NOT expose a manual control to set the status to "Submitted" or "Pending" in the admin UI; these two statuses are managed exclusively by the System.

---

### Requirement 10: Report Generation for Admin

**User Story:** As an admin, I want to generate and export summary reports of applicant data, so that I can analyze program performance and submission trends.

#### Acceptance Criteria

1. WHEN an admin accesses the Reports section of the admin dashboard, THE System SHALL display aggregate counts of applicants grouped by: status, campus, and degree program.
2. WHEN an admin selects a date range filter, THE System SHALL recalculate and display report data for only the applications submitted within that date range.
3. WHEN an admin clicks "Export as CSV", THE System SHALL generate and download a CSV file containing applicant records with columns: applicant name, email, degree program, campus, status, submission date, and admin remarks.
4. WHEN an admin clicks "Export as PDF", THE System SHALL generate and download a PDF summary report containing the aggregate counts and charts visible on the Reports page.
5. IF no applicant records match the selected filters, THEN THE System SHALL display "No data available for the selected filters." and SHALL disable the export buttons.
