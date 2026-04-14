-- Migration: Add file_feedback column to applications and portfolio_submissions tables
-- Requirements: 1.1, 1.2

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS file_feedback JSONB DEFAULT '[]'::jsonb;

ALTER TABLE portfolio_submissions
  ADD COLUMN IF NOT EXISTS file_feedback JSONB DEFAULT '[]'::jsonb;
