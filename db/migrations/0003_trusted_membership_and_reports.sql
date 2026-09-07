-- Approved membership lifecycle, centralized role grants, tenant-safe keys,
-- and trusted report receipts. Existing automatically-created memberships are
-- intentionally left pending until an administrator approves them.

alter table organization_members
  add column invited_by uuid references auth.users(id),
  add column invited_at timestamptz not null default now(),
  add column accepted_at timestamptz,
  add column expires_at timestamptz,
  add column revoked_at timestamptz,
  add column revocation_reason text;

create table organization_invitations (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  email text not null,
  member_role text not null check (
    member_role in ('SME_USER', 'BROKER_RISK_ADVISOR', 'INSURER_REVIEWER', 'ADMIN')
  ),
  token_hash text not null,
  invited_by uuid not null references auth.users(id),
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  primary key (organization_id, id),
  unique (organization_id, token_hash)
);

create table role_permissions (
  role_name text not null,
  action_name text not null,
  created_at timestamptz not null default now(),
  primary key (role_name, action_name),
  check (role_name in ('SME_USER', 'BROKER_RISK_ADVISOR', 'INSURER_REVIEWER', 'ADMIN')),
  check (action_name in (
    'VIEW_WORKSPACE', 'SUBMIT_REVIEW', 'GENERATE_REPORT', 'MANAGE_MEMBERS',
    'CONFIGURE_INTEGRATIONS', 'PROMOTE_FACT', 'REPLAY_OUTBOUND'
  ))
);

insert into role_permissions (role_name, action_name) values
  ('SME_USER', 'VIEW_WORKSPACE'),
  ('SME_USER', 'SUBMIT_REVIEW'),
  ('SME_USER', 'GENERATE_REPORT'),
  ('BROKER_RISK_ADVISOR', 'VIEW_WORKSPACE'),
  ('BROKER_RISK_ADVISOR', 'SUBMIT_REVIEW'),
  ('BROKER_RISK_ADVISOR', 'GENERATE_REPORT'),
  ('BROKER_RISK_ADVISOR', 'PROMOTE_FACT'),
  ('INSURER_REVIEWER', 'VIEW_WORKSPACE'),
  ('INSURER_REVIEWER', 'SUBMIT_REVIEW'),
  ('INSURER_REVIEWER', 'GENERATE_REPORT'),
  ('INSURER_REVIEWER', 'PROMOTE_FACT'),
  ('ADMIN', 'VIEW_WORKSPACE'),
  ('ADMIN', 'SUBMIT_REVIEW'),
  ('ADMIN', 'GENERATE_REPORT'),
  ('ADMIN', 'MANAGE_MEMBERS'),
  ('ADMIN', 'CONFIGURE_INTEGRATIONS'),
  ('ADMIN', 'PROMOTE_FACT'),
  ('ADMIN', 'REPLAY_OUTBOUND');

alter table assessments drop constraint assessments_pkey;
alter table assessments add primary key (organization_id, id);
alter table evidence_artifacts drop constraint evidence_artifacts_pkey;
alter table evidence_artifacts add primary key (organization_id, id);
alter table reports drop constraint reports_pkey;
alter table reports add primary key (organization_id, id);

alter table reports
  add column configuration_version text not null default 'demo-config-2026.08.1',
  add column review_event_ids uuid[] not null default '{}',
  add column receipt_hash text not null default 'legacy-unbound-receipt';

create function reject_coverage_ambiguous_review_status() returns trigger
language plpgsql as $$
begin
  if new.status = 'CONFIRMED' then
    raise exception 'CONFIRMED is not an allowed workflow disposition';
  end if;
  return new;
end;
$$;

alter table reviews drop constraint reviews_status_check;
alter table reviews add constraint reviews_status_check check (
  status in (
    'OPEN', 'REVIEWING', 'CONFIRMED', 'DISMISSED',
    'MORE_EVIDENCE_REQUESTED', 'ESCALATED',
    'REVIEW_COMPLETED_NO_COVERAGE_DECISION'
  )
);

create trigger reviews_reject_coverage_ambiguous_status
before insert on reviews
for each row execute function reject_coverage_ambiguous_review_status();

revoke execute on function reject_coverage_ambiguous_review_status() from public, anon, authenticated;

alter table organization_invitations enable row level security;
alter table role_permissions enable row level security;

create policy member_can_read_role_permissions on role_permissions
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.user_id = (select auth.uid())
      and membership.accepted_at is not null
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now())
  ));

create policy admin_can_read_invitations on organization_invitations
  for select to authenticated
  using (exists (
    select 1 from organization_members membership
    where membership.organization_id = organization_invitations.organization_id
      and membership.user_id = (select auth.uid())
      and membership.member_role = 'ADMIN'
      and membership.accepted_at is not null
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now())
  ));

revoke all on organization_invitations, role_permissions from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
