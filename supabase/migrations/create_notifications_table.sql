-- Migration: create notifications table
-- Feature: notifications-and-email-automation

create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  type           text not null,
  applicant_name text,
  application_id uuid references applications(application_id) on delete cascade,
  created_at     timestamptz not null default now(),
  is_read        boolean not null default false
);

-- Enable Row Level Security
alter table notifications enable row level security;

-- Admins (authenticated users) can read all notifications
create policy "Admins can read notifications"
  on notifications for select
  using (auth.role() = 'authenticated');

-- Admins (authenticated users) can update notifications (e.g. mark as read)
create policy "Admins can update notifications"
  on notifications for update
  using (auth.role() = 'authenticated');

-- Service role can insert notifications (used from API routes with service key)
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);
