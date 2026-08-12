-- Append-only professional review discussion. Review decisions remain in the
-- reviews table; comments are deliberately separate from decision state.

create table review_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references organizations(id),
  assessment_id text not null,
  case_id text not null,
  finding_id text,
  activity_type text not null check (activity_type = 'COMMENT_ADDED'),
  visibility text not null check (
    visibility in ('SHARED', 'PROFESSIONAL_ONLY')
  ),
  message text not null check (
    char_length(message) between 2 and 1500
  ),
  author_subject text not null,
  author_role text not null check (
    author_role in ('SME_USER', 'BROKER_RISK_ADVISOR', 'INSURER_REVIEWER')
  ),
  idempotency_key text not null,
  occurred_at timestamptz not null,
  receipt_hash text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, assessment_id)
    references assessments(organization_id, id)
);

create index review_activities_tenant_case_time_idx
  on review_activities (organization_id, case_id, occurred_at asc);

alter table review_activities enable row level security;

create policy member_can_read_review_activities on review_activities
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = review_activities.organization_id
      and membership.user_id = (select auth.uid())
  ));

revoke all on review_activities from anon, authenticated;

create trigger review_activities_append_only
before update or delete on review_activities
for each row execute function prevent_append_only_mutation();
