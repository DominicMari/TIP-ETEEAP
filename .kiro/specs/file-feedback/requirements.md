# Requirements Document

## Introduction

The File Feedback feature enables admins to submit targeted, file-specific feedback while reviewing an applicant's documents inside the `ViewApplicantModal` (applicantsmanage.tsx) or `ViewSubmissionModal` (portfoliosubmissions.tsx). When feedback is submitted, it is persisted to the database as a JSONB array on the relevant record, an email notification is dispatched to the applicant via the existing `/api/send-email` infrastructure, and the feedback is rendered on the applicant's tracker page (`app/tracker/page.tsx`) in a dedicated `FileFeedbackSection` component.

The feature is additive and backward-compatible: existing usages of `ImageViewer` and `FileViewer` that do not supply the new `onFeedback` prop are unaffected.

---

## Glossary

- **Admin**: An authenticated administrator user operating the admin dashboard.
- **Applicant**: A user who has submitted an application or portfolio submission.
- **Application**: A record in the `applications` Supabase table identified by `application_id` (UUID).
- **Portfolio_Submission**: A record in the `portfolio_submissions` Supabase table identified by `id` (integer).
- **FileFeedbackEntry**: A structured object containing `fileName`, `message`, `adminName`, and `createdAt` fields stored within the `file_feedback` JSONB array.
- **FileFeedbackModal**: The modal component that collects the admin's feedback message for a specific file.
- **FileFeedbackSection**: The read-only component rendered on the tracker page that displays all feedback entries for an applicant.
- **ImageViewer**: The existing `components/admin/ImageViewer.tsx` component used to view image files.
- **FileViewer**: The existing `components/admin/FileViewer.tsx` component used to view non-image files.
- **ViewApplicantModal**: The modal in `applicantsmanage.tsx` used by admins to review application submissions.
- **ViewSubmissionModal**: The modal in `portfoliosubmissions.tsx` used by admins to review portfolio submissions.
- **Tracker_Page**: The applicant-facing page at `app/tracker/page.tsx` that shows application status and feedback.
- **API_Route**: The Next.js API route at `app/api/file-feedback/route.ts`.
- **Email_Service**: The existing `/api/send-email` route backed by Resend.
- **file_feedback**: The JSONB column added to both `applications` and `portfolio_submissions` tables.
- **sourceType**: A discriminator field with value `'application'` or `'portfolio'` that identifies which table a feedback submission targets.

---

## Requirements

### Requirement 1: Database Schema Extension

**User Story:** As a system, I need to persist file feedback entries alongside the application and portfolio records, so that feedback is co-located with the record it belongs to and is available to the tracker page without additional joins.

#### Acceptance Criteria

1. THE `applications` table SHALL have a `file_feedback` column of type `JSONB` with a default value of `'[]'::jsonb`.
2. THE `portfolio_submissions` table SHALL have a `file_feedback` column of type `JSONB` with a default value of `'[]'::jsonb`.
3. WHEN the `file_feedback` column is `NULL` in an existing record, THE API_Route SHALL treat it as an empty array and proceed with the append operation normally.
4. THE `file_feedback` column SHALL store an array of `FileFeedbackEntry` objects, where each entry contains `fileName` (string), `message` (string), `adminName` (string), and `createdAt` (ISO 8601 string) fields.

---

### Requirement 2: File Feedback API Route

**User Story:** As an admin, I want a dedicated API endpoint to submit file feedback, so that feedback is validated, persisted, and triggers an email notification in a single operation.

#### Acceptance Criteria

1. THE API_Route SHALL accept `POST` requests at `/api/file-feedback` with a JSON body containing `sourceType`, `recordId`, `fileName`, `message`, and `adminName` fields.
2. WHEN `sourceType` is not `'application'` or `'portfolio'`, THE API_Route SHALL return HTTP 400 with an error message and SHALL NOT modify any database record.
3. WHEN `recordId` is missing or empty, THE API_Route SHALL return HTTP 400 with an error message and SHALL NOT modify any database record.
4. WHEN `message` is an empty string or contains only whitespace characters, THE API_Route SHALL return HTTP 400 with an error message and SHALL NOT modify any database record.
5. WHEN `message.length` exceeds 2000 characters, THE API_Route SHALL return HTTP 400 with an error message and SHALL NOT modify any database record.
6. WHEN `fileName` is missing or empty, THE API_Route SHALL return HTTP 400 with an error message and SHALL NOT modify any database record.
7. WHEN all inputs are valid and the target record exists, THE API_Route SHALL append a new `FileFeedbackEntry` to the record's `file_feedback` array and return HTTP 200 with `{ success: true, entry: FileFeedbackEntry }`.
8. WHEN the target record does not exist, THE API_Route SHALL return HTTP 404 with an error message and SHALL NOT modify any database record.
9. IF the database update fails, THEN THE API_Route SHALL return HTTP 500 with an error message.
10. WHEN `sourceType` is `'application'`, THE API_Route SHALL update the `applications` table using `application_id` as the identifier.
11. WHEN `sourceType` is `'portfolio'`, THE API_Route SHALL update the `portfolio_submissions` table using `id` as the identifier.
12. THE API_Route SHALL use the Supabase service-role client to perform database operations, consistent with the existing `/api/update-status` route.
13. THE API_Route SHALL validate the requester is an authenticated admin session using `getServerSession` from NextAuth before processing any request.

---

### Requirement 3: Email Notification on Feedback Submission

**User Story:** As an applicant, I want to receive an email when an admin provides feedback on one of my files, so that I am promptly informed and can take corrective action.

#### Acceptance Criteria

1. WHEN a feedback entry is successfully persisted to the database and the applicant's email address is non-null, THE API_Route SHALL call the Email_Service exactly once with the applicant's email as the recipient and a subject containing "File Feedback".
2. THE Email_Service SHALL receive an email body that contains the `fileName`, the `message`, and the applicant's name (or the string `"Applicant"` when the name is null) as substrings.
3. IF the Email_Service call fails after a successful database update, THEN THE API_Route SHALL log the failure and SHALL NOT revert the database update.
4. WHEN `sourceType` is `'portfolio'` and the portfolio submission has no linked application record, THE API_Route SHALL skip the email step and SHALL still return HTTP 200 with the persisted entry.
5. WHEN the applicant's email address cannot be resolved, THE API_Route SHALL skip the email step and SHALL still return HTTP 200 with the persisted entry.

---

### Requirement 4: ImageViewer Feedback Button

**User Story:** As an admin, I want a "Give Feedback" button in the ImageViewer toolbar, so that I can initiate feedback for the currently displayed image without leaving the viewer.

#### Acceptance Criteria

1. THE ImageViewer SHALL accept an optional `onFeedback` prop of type `(imageUrl: string, imageName: string) => void`.
2. WHEN `onFeedback` is provided, THE ImageViewer SHALL render a "Give Feedback" button in the toolbar alongside the existing Download button.
3. WHEN the "Give Feedback" button is clicked, THE ImageViewer SHALL call `onFeedback` with the URL and name of the currently displayed image.
4. WHEN `onFeedback` is not provided, THE ImageViewer SHALL render identically to its current behavior and SHALL NOT display a "Give Feedback" button.

---

### Requirement 5: FileViewer Feedback Button

**User Story:** As an admin, I want a "Give Feedback" button in the FileViewer, so that I can initiate feedback for the currently selected file without leaving the viewer.

#### Acceptance Criteria

1. THE FileViewer SHALL accept an optional `onFeedback` prop of type `(fileUrl: string, fileName: string) => void`.
2. WHEN `onFeedback` is provided and a file is selected, THE FileViewer SHALL render a "Give Feedback" button in the file info bar at the bottom of the preview area.
3. WHEN the "Give Feedback" button is clicked, THE FileViewer SHALL call `onFeedback` with the URL and name of the currently selected file.
4. WHEN `onFeedback` is not provided, THE FileViewer SHALL render identically to its current behavior and SHALL NOT display a "Give Feedback" button.

---

### Requirement 6: FileFeedbackModal Component

**User Story:** As an admin, I want a focused modal to compose and submit file feedback, so that I can clearly see which file I am targeting and write a detailed message before sending.

#### Acceptance Criteria

1. THE FileFeedbackModal SHALL display the target file name prominently so the admin can confirm the correct file is being targeted.
2. THE FileFeedbackModal SHALL render a textarea for the feedback message with a maximum length of 2000 characters and a visible character counter.
3. WHEN the admin submits an empty or whitespace-only message, THE FileFeedbackModal SHALL display an inline validation error and SHALL NOT call the API_Route.
4. WHEN the admin submits a valid message, THE FileFeedbackModal SHALL display a loading state and call `POST /api/file-feedback`.
5. WHEN the API_Route returns a success response, THE FileFeedbackModal SHALL call the `onSuccess` callback with the new `FileFeedbackEntry` and close the modal.
6. WHEN the API_Route returns an error response, THE FileFeedbackModal SHALL display the error message inline and SHALL keep the modal open.
7. THE FileFeedbackModal SHALL support closing via the ESC key and a close button.
8. THE FileFeedbackModal SHALL implement a focus trap so keyboard navigation remains within the modal while it is open.

---

### Requirement 7: ViewApplicantModal Integration

**User Story:** As an admin, I want to give feedback on files while reviewing an applicant's application, so that I can annotate specific documents without switching contexts.

#### Acceptance Criteria

1. THE ViewApplicantModal SHALL pass an `onFeedback` callback to both the ImageViewer and FileViewer instances it renders.
2. WHEN `onFeedback` is triggered from either viewer, THE ViewApplicantModal SHALL open the FileFeedbackModal with `sourceType` set to `'application'` and `recordId` set to the applicant's `application_id`.
3. WHEN the FileFeedbackModal calls `onSuccess`, THE ViewApplicantModal SHALL optimistically update the local applicant state to append the new `FileFeedbackEntry` to the `file_feedback` array without requiring a full data refetch.
4. THE ViewApplicantModal SHALL pass the admin's display name to the FileFeedbackModal as the `adminName` prop.

---

### Requirement 8: ViewSubmissionModal Integration

**User Story:** As an admin, I want to give feedback on files while reviewing a portfolio submission, so that I can annotate specific portfolio documents without switching contexts.

#### Acceptance Criteria

1. THE ViewSubmissionModal SHALL pass an `onFeedback` callback to both the ImageViewer and FileViewer instances it renders.
2. WHEN `onFeedback` is triggered from either viewer, THE ViewSubmissionModal SHALL open the FileFeedbackModal with `sourceType` set to `'portfolio'` and `recordId` set to the submission's `id`.
3. WHEN the FileFeedbackModal calls `onSuccess`, THE ViewSubmissionModal SHALL optimistically update the local submission state to append the new `FileFeedbackEntry` to the `file_feedback` array without requiring a full data refetch.
4. THE ViewSubmissionModal SHALL pass the admin's display name to the FileFeedbackModal as the `adminName` prop.

---

### Requirement 9: Tracker Page — FileFeedbackSection

**User Story:** As an applicant, I want to see file-specific feedback from the admin on my tracker page, so that I know exactly which documents need to be corrected or resubmitted.

#### Acceptance Criteria

1. THE Tracker_Page `Application` interface SHALL include a `file_feedback` field of type `FileFeedbackEntry[] | null`.
2. WHEN an application record contains a non-empty `file_feedback` array, THE Tracker_Page SHALL render a `FileFeedbackSection` component displaying all feedback entries.
3. WHEN the `file_feedback` array is empty or null, THE Tracker_Page SHALL not render the `FileFeedbackSection`.
4. THE FileFeedbackSection SHALL render each `FileFeedbackEntry` as a distinct card containing the `fileName`, `message`, `adminName`, and a human-readable formatted `createdAt` date.
5. THE FileFeedbackSection SHALL display a section header labelled "File Feedback from Admin" with a distinguishing icon.
6. THE FileFeedbackSection SHALL use a visually distinct style (e.g., amber/orange border) to differentiate it from the existing `admin_remarks` block.
7. THE FileFeedbackSection SHALL display feedback entries in the order they were appended (oldest first).

---

### Requirement 10: Feedback Entry Integrity

**User Story:** As a system, I need to guarantee that appending a feedback entry never destroys existing entries, so that the complete feedback history is always preserved.

#### Acceptance Criteria

1. WHEN a new `FileFeedbackEntry` is appended to a `file_feedback` array of length N, THE resulting array SHALL have length N+1.
2. WHEN a new `FileFeedbackEntry` is appended, all N pre-existing entries SHALL be preserved in their original order.
3. THE new `FileFeedbackEntry` SHALL be the last element of the resulting array.
4. WHEN the `file_feedback` column value is `NULL` in the database, THE API_Route SHALL treat it as an empty array before appending, resulting in an array of length 1.
