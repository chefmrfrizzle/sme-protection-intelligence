-- Supabase authentication, tenant membership, and Data API hardening.

create table organization_members (
  organization_id text not null references organizations(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (
    member_role in ('SME_USER', 'BROKER_RISK_ADVISOR', 'INSURER_REVIEWER', 'ADMIN')
  ),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx
  on organization_members (user_id, organization_id);

alter table organization_members enable row level security;

drop policy if exists tenant_organizations on organizations;
drop policy if exists tenant_assessments on assessments;
drop policy if exists tenant_assessment_versions on assessment_versions;
drop policy if exists tenant_evidence_artifacts on evidence_artifacts;
drop policy if exists tenant_reviews on reviews;
drop policy if exists tenant_audit_events on audit_events;
drop policy if exists tenant_reports on reports;

create policy member_can_read_own_membership on organization_members
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy member_can_read_organization on organizations
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = organizations.id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_assessments on assessments
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = assessments.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_assessment_versions on assessment_versions
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = assessment_versions.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_evidence on evidence_artifacts
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = evidence_artifacts.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_reviews on reviews
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = reviews.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_audit_events on audit_events
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = audit_events.organization_id
      and membership.user_id = (select auth.uid())
  ));

create policy member_can_read_reports on reports
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = reports.organization_id
      and membership.user_id = (select auth.uid())
  ));

-- The public app writes through authenticated, validated server routes. Keep the
-- Data API read-only and inaccessible until a future direct-client need exists.
revoke all on organizations, organization_members, assessments,
  assessment_versions, evidence_artifacts, reviews, audit_events, reports
  from anon, authenticated;

insert into organizations (id, legal_name)
values ('org_pacific_components', 'Pacific Components Pte Ltd')
on conflict (id) do nothing;
