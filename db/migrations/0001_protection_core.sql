-- Production target schema. Do not apply to the public demo until authentication,
-- tenant claims, region, retention, and access policies have been approved.

create extension if not exists pgcrypto;

create table organizations (
  id text primary key,
  legal_name text not null,
  created_at timestamptz not null default now()
);

create table assessments (
  id text primary key,
  organization_id text not null references organizations(id),
  current_version integer not null check (current_version > 0),
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table assessment_versions (
  organization_id text not null references organizations(id),
  assessment_id text not null,
  version integer not null check (version > 0),
  snapshot_at timestamptz not null,
  evidence_snapshot_id text not null,
  ruleset_version text not null,
  snapshot jsonb not null,
  snapshot_hash text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, assessment_id, version),
  foreign key (organization_id, assessment_id)
    references assessments(organization_id, id)
);

create table evidence_artifacts (
  id text primary key,
  organization_id text not null references organizations(id),
  document_type text not null,
  file_name text not null,
  document_version text not null,
  object_key text not null,
  source_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, source_hash)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references organizations(id),
  assessment_id text not null,
  finding_id text not null,
  status text not null check (
    status in (
      'OPEN', 'REVIEWING', 'CONFIRMED', 'DISMISSED',
      'MORE_EVIDENCE_REQUESTED', 'ESCALATED'
    )
  ),
  reviewer_subject text not null,
  reviewer_role text not null,
  rationale text,
  idempotency_key text not null,
  occurred_at timestamptz not null,
  receipt_hash text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, assessment_id)
    references assessments(organization_id, id)
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references organizations(id),
  event_type text not null,
  actor_subject text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  snapshot_hash text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table reports (
  id text primary key,
  organization_id text not null references organizations(id),
  assessment_id text not null,
  evidence_snapshot_id text not null,
  ruleset_version text not null,
  object_key text,
  content_hash text not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, assessment_id)
    references assessments(organization_id, id)
);

create index assessment_versions_tenant_time_idx
  on assessment_versions (organization_id, snapshot_at desc);
create index evidence_artifacts_tenant_type_idx
  on evidence_artifacts (organization_id, document_type);
create index reviews_tenant_finding_time_idx
  on reviews (organization_id, finding_id, occurred_at desc);
create index audit_events_tenant_time_idx
  on audit_events (organization_id, occurred_at desc);
create index reports_tenant_time_idx
  on reports (organization_id, generated_at desc);

alter table organizations enable row level security;
alter table assessments enable row level security;
alter table assessment_versions enable row level security;
alter table evidence_artifacts enable row level security;
alter table reviews enable row level security;
alter table audit_events enable row level security;
alter table reports enable row level security;

create policy tenant_organizations on organizations
  using (id = current_setting('app.organization_id', true));
create policy tenant_assessments on assessments
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));
create policy tenant_assessment_versions on assessment_versions
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));
create policy tenant_evidence_artifacts on evidence_artifacts
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));
create policy tenant_reviews on reviews
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));
create policy tenant_audit_events on audit_events
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));
create policy tenant_reports on reports
  using (organization_id = current_setting('app.organization_id', true))
  with check (organization_id = current_setting('app.organization_id', true));

create function prevent_append_only_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

create trigger reviews_append_only
before update or delete on reviews
for each row execute function prevent_append_only_mutation();

create trigger audit_events_append_only
before update or delete on audit_events
for each row execute function prevent_append_only_mutation();

create trigger assessment_versions_append_only
before update or delete on assessment_versions
for each row execute function prevent_append_only_mutation();
