# Implementation Plan: File Feedback

## Overview

Implement the File Feedback feature end-to-end: SQL migration, API route, modal component, viewer modifications, modal wiring into both admin views, tracker page section, and property-based tests.

## Tasks

- [x] 1. Run SQL migration to add `file_feedback` column to both tables
  - Create `supabase/migrations/add_file_feedback_column.sql` with the two `ALTER TABLE` statements from the design
  - `ALTER TABLE applications ADD COLUMN IF NOT EXISTS file_feedback JSONB DEFAULT '[]'::jsonb;`
  - `ALTER TABLE portfolio_submissions ADD COLUMN IF NOT EXISTS file_feedback JSONB DEFAULT '[]'::jsonb;`
  - Apply the migration against the Supabase project (run via Supabase CLI or the dashboard SQL editor)
  - _Requirements: 1.1, 1.2_

- [x] 2. Create `/api/file-feedback` API route
  - [x] 2.1 Scaffold `app/api/file-feedback/route.ts` with the POST handler
    - Import the Supabase service-role client (same pattern as `app/api/update-status/route.ts`)
    - Import `getServerSession` from `next-auth` and the auth options from `lib/auth.js`
    - Validate `sourceType` against the allowlist `['application', 'portfolio']`; return 400 if invalid
    - Validate `recordId`, `fileName`, and `message` (non-empty, `message` ≤ 2000 chars); return 400 for each failure
    - Determine `table`, `idColumn`, and `emailColumn` from `sourceType`
    - Fetch the current record; return 404 if not found
    - Build `newEntry: FileFeedbackEntry` with `fileName`, `message`, `adminName`, and `createdAt: new Date().toISOString()`
    - Append to `record.file_feedback ?? []` and `UPDATE` the record; return 500 on DB error
    - Resolve applicant email: direct from `applications.email_address`; for portfolio, fetch linked application via `user_id`
    - Call `POST /api/send-email` with subject `"File Feedback – TIP ETEEAP"` and a body containing `fileName`, `message`, and applicant name; log failure but do not revert DB update
    - Return `{ success: true, entry: newEntry }` on success
    - _Requirements: 2.1–2.13, 3.1–3.5_

  - [x] 2.2 Write property test — invalid `message` is rejected (Property 4)
    - **Property 4: Invalid message is rejected by the API**
    - Generate empty strings, whitespace-only strings, and strings longer than 2000 characters as `message`
    - Assert the handler returns HTTP 400 and does not call the DB update path
    - Tag: `// Feature: file-feedback, Property 4: Invalid message is rejected by the API`
    - **Validates: Requirements 2.4, 2.5**

  - [x] 2.3 Write property test — invalid `sourceType` is rejected (Property 5)
    - **Property 5: Invalid sourceType is rejected**
    - Generate arbitrary strings that are not `'application'` or `'portfolio'`
    - Assert the handler returns HTTP 400 and does not call the DB update path
    - Tag: `// Feature: file-feedback, Property 5: Invalid sourceType is rejected`
    - **Validates: Requirements 2.2**

- [x] 3. Create `FileFeedbackModal` component
  - [x] 3.1 Scaffold `components/admin/FileFeedbackModal.tsx`
    - Accept props: `isOpen`, `onClose`, `fileName`, `sourceType`, `recordId`, `adminName`, `onSuccess`
    - Render the target `fileName` prominently at the top of the modal
    - Render a `<textarea>` with `maxLength={2000}` and a live character counter (`{message.length}/2000`)
    - Implement client-side validation: show inline error and block submission when message is empty or whitespace-only
    - On valid submit: set `isSubmitting = true`, call `POST /api/file-feedback`, handle success (`onSuccess(entry)` + `onClose()`) and error (display inline)
    - Implement focus trap (first focusable element on open, Tab cycles within modal)
    - Close on ESC key and close button; add `aria-modal`, `role="dialog"`, and `aria-labelledby` attributes
    - _Requirements: 6.1–6.8_

  - [x] 3.2 Write property test — whitespace-only message is rejected client-side (Property 9)
    - **Property 9: FileFeedbackModal rejects whitespace-only messages client-side**
    - Generate strings composed entirely of whitespace characters
    - Render the component, set the textarea value, submit, and assert the validation error is shown and `fetch` is not called
    - Tag: `// Feature: file-feedback, Property 9: FileFeedbackModal rejects whitespace-only messages client-side`
    - **Validates: Requirements 6.3**

- [x] 4. Add optional `onFeedback` prop to `ImageViewer`
  - Extend `ImageViewerProps` in `components/admin/ImageViewer.tsx` with `onFeedback?: (imageUrl: string, imageName: string) => void`
  - When `onFeedback` is provided, render a "Give Feedback" button (use `MessageSquare` icon from `lucide-react`) in the toolbar next to the Download button
  - On click, call `onFeedback(images[currentIndex], \`image-\${currentIndex + 1}\`)` — use the image URL as the name fallback
  - When `onFeedback` is not provided, render no button and leave all existing behavior unchanged
  - _Requirements: 4.1–4.4_

- [x] 5. Add optional `onFeedback` prop to `FileViewer`
  - Extend `FileViewerProps` in `components/admin/FileViewer.tsx` with `onFeedback?: (fileUrl: string, fileName: string) => void`
  - When `onFeedback` is provided and a file is selected, render a "Give Feedback" button in the File Info Bar (bottom bar) alongside the existing navigation controls
  - On click, call `onFeedback(selectedFile.url, selectedFile.name)`
  - When `onFeedback` is not provided, render no button and leave all existing behavior unchanged
  - _Requirements: 5.1–5.4_

- [x] 5.1 Write property test — `onFeedback` backward compatibility (Property 7)
  - **Property 7: onFeedback prop is backward-compatible**
  - Render `ImageViewer` and `FileViewer` without the `onFeedback` prop across varied `images`/`files` inputs
  - Assert no "Give Feedback" button is present in the rendered output
  - Tag: `// Feature: file-feedback, Property 7: onFeedback prop is backward-compatible`
  - **Validates: Requirements 4.4, 5.4**

- [x] 5.2 Write property test — `onFeedback` called with correct arguments (Property 8)
  - **Property 8: onFeedback is called with the correct file arguments**
  - Generate random image URL arrays and file lists; simulate clicking "Give Feedback" at various indices
  - Assert `onFeedback` is called with the URL and name of the currently displayed/selected file
  - Tag: `// Feature: file-feedback, Property 8: onFeedback is called with the correct file arguments`
  - **Validates: Requirements 4.3, 5.3**

- [x] 6. Wire `FileFeedbackModal` into `ViewApplicantModal` (`applicantsmanage.tsx`)
  - Add `feedbackModal: { fileName: string; fileUrl: string } | null` state (initially `null`)
  - Pass `onFeedback={(url, name) => setFeedbackModal({ fileName: name, fileUrl: url })}` to both the `ImageViewer` and `FileViewer` instances inside `ViewApplicantModal`
  - Render `<FileFeedbackModal>` when `feedbackModal !== null`, with `sourceType="application"`, `recordId={applicant.application_id}`, and `adminName` from the session (use `session?.user?.name ?? 'Admin'`)
  - In `onSuccess`: optimistically append the new `FileFeedbackEntry` to `selectedApplicant.file_feedback` via `setSelectedApplicant`; then call `setFeedbackModal(null)`
  - Import `FileFeedbackModal` and the `FileFeedbackEntry` type
  - _Requirements: 7.1–7.4_

- [x] 7. Wire `FileFeedbackModal` into `ViewSubmissionModal` (`portfoliosubmissions.tsx`)
  - Add `feedbackModal: { fileName: string; fileUrl: string } | null` state (initially `null`) inside `ViewSubmissionModal`
  - Pass `onFeedback={(url, name) => setFeedbackModal({ fileName: name, fileUrl: url })}` to both the `ImageViewer` and `FileViewer` instances inside `ViewSubmissionModal`
  - Render `<FileFeedbackModal>` when `feedbackModal !== null`, with `sourceType="portfolio"`, `recordId={String(submission.id)}`, and `adminName` from the session
  - In `onSuccess`: optimistically append the new `FileFeedbackEntry` to `selectedSubmission.file_feedback` via `setSelectedSubmission`; then call `setFeedbackModal(null)`
  - Add `file_feedback: FileFeedbackEntry[] | null` to the `PortfolioSubmission` interface
  - Import `FileFeedbackModal` and the `FileFeedbackEntry` type
  - _Requirements: 8.1–8.4_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add `FileFeedbackSection` to `app/tracker/page.tsx`
  - [x] 9.1 Extend the `Application` interface with `file_feedback: FileFeedbackEntry[] | null`
    - Add the `FileFeedbackEntry` interface (inline or imported) with `fileName`, `message`, `adminName`, `createdAt` fields
    - _Requirements: 9.1_

  - [x] 9.2 Implement the `FileFeedbackSection` component (inline in `app/tracker/page.tsx`)
    - Accept `feedback: FileFeedbackEntry[]` prop
    - Render a section header "File Feedback from Admin" with a `Paperclip` icon from `lucide-react`
    - Render each entry as a card with `fileName`, `message`, `adminName`, and a human-readable `createdAt` (use the existing `formatDate` helper)
    - Use amber/orange border styling (`border-amber-200 bg-amber-50`) to visually distinguish from the `admin_remarks` block
    - Render entries in array order (oldest first — no sorting needed, they are appended in order)
    - _Requirements: 9.4, 9.5, 9.6, 9.7_

  - [x] 9.3 Render `FileFeedbackSection` inside `ProgressTracker`
    - After the existing `admin_remarks` block, add:
      `{application.file_feedback && application.file_feedback.length > 0 && (<FileFeedbackSection feedback={application.file_feedback} />)}`
    - _Requirements: 9.2, 9.3_

  - [x] 9.4 Write property test — `FileFeedbackSection` renders all entries (Property 6)
    - **Property 6: FileFeedbackSection renders all entries with required fields**
    - Generate random arrays of `FileFeedbackEntry` objects of varying lengths (including length 0)
    - Assert the component renders exactly N cards for N entries, each containing `fileName`, `message`, `adminName`, and a non-empty date string
    - Assert nothing is rendered when the array is empty
    - Tag: `// Feature: file-feedback, Property 6: FileFeedbackSection renders all entries with required fields`
    - **Validates: Requirements 9.2, 9.4, 9.7**

- [x] 10. Write property test — append preserves existing entries (Property 1)
  - **Property 1: Feedback entry is appended, not replaced**
  - Extract or inline the `appendFeedbackEntry(existing, newEntry)` pure function from the API route logic
  - Generate random arrays of `FileFeedbackEntry` (including `null`/`undefined` as `existing`) and a random `newEntry`
  - Assert `result.length === (existing ?? []).length + 1`
  - Assert all original entries are present in their original order at indices 0..N-1
  - Assert `result[result.length - 1]` deep-equals `newEntry`
  - Tag: `// Feature: file-feedback, Property 1: Feedback entry is appended, not replaced`
  - **Validates: Requirements 10.1, 10.2, 10.3, 1.3, 10.4**

- [x] 10.1 Write property test — email body contains all required fields (Property 3)
  - **Property 3: Email body contains all required fields**
  - Extract or inline the `buildFeedbackEmailBody(applicantName, fileName, message)` pure function
  - Generate random combinations of `applicantName` (including `null`), `fileName`, and `message`
  - Assert the returned string contains `fileName` as a substring
  - Assert the returned string contains `message` as a substring
  - Assert the returned string contains `applicantName` (or `"Applicant"` when null) as a substring
  - Tag: `// Feature: file-feedback, Property 3: Email body contains all required fields`
  - **Validates: Requirements 3.2**

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (already in the project's recommended tooling)
- The `appendFeedbackEntry` and `buildFeedbackEmailBody` functions should be exported from the API route (or a shared `lib/utils/fileFeedback.ts`) so they can be unit/property tested in isolation
- The `FileFeedbackEntry` type should be defined once in a shared location (e.g., `lib/types/fileFeedback.ts`) and imported by the API route, modal, tracker page, and tests
