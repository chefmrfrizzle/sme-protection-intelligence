-- Synthetic evidence lifecycle, grounded extraction candidates, temporal facts,
-- source spans, conflicts, corrections, access records, and erasure tombstones.

alter table evidence_artifacts
  add column classification text not null default 'SYNTHETIC_DEMO',
  add column synthetic boolean not null default true,
  add column source_identity text not null default 'synthetic-fixture';

alter table role_permissions drop constraint role_permissions_action_name_check;
alter table role_permissions add constraint role_permissions_action_name_check check (
  action_name in (
    'VIEW_WORKSPACE', 'SUBMIT_REVIEW', 'GENERATE_REPORT', 'MANAGE_MEMBERS',
    'CONFIGURE_INTEGRATIONS', 'PROMOTE_FACT', 'REPLAY_OUTBOUND',
    'ERASE_EVIDENCE'
  )
);
insert into role_permissions (role_name, action_name)
values ('ADMIN', 'ERASE_EVIDENCE');

create table evidence_versions (
  organization_id text not null,
  artifact_id text not null,
  id uuid not null default gen_random_uuid(),
  version_label text not null,
  object_key text not null,
  declared_mime text not null,
  detected_mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text not null,
  lifecycle_state text not null check (lifecycle_state in (
    'QUARANTINED', 'REJECTED_TYPE_MISMATCH', 'REJECTED_OVERSIZE',
    'REJECTED_MALWARE', 'APPROVED_FOR_PROCESSING'
  )),
  scanner_id text,
  source_identity text not null,
  retention_until timestamptz,
  legal_hold boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (organization_id, artifact_id, id),
  unique (organization_id, artifact_id, version_label),
  unique (organization_id, sha256),
  foreign key (organization_id, artifact_id)
    references evidence_artifacts(organization_id, id)
);

create table evidence_lifecycle_events (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  artifact_id text not null,
  evidence_version_id uuid not null,
  state text not null,
  reason_code text,
  actor_subject text not null,
  receipt_hash text not null,
  occurred_at timestamptz not null,
  primary key (organization_id, id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table evidence_access_events (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  artifact_id text not null,
  evidence_version_id uuid not null,
  action text not null check (action in (
    'UPLOAD', 'READ_METADATA', 'SIGNED_DOWNLOAD', 'RETENTION_CHANGE',
    'LEGAL_HOLD_CHANGE', 'ERASURE_REQUEST'
  )),
  actor_subject text not null,
  purpose text not null,
  receipt_hash text not null,
  occurred_at timestamptz not null,
  primary key (organization_id, id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table erasure_tombstones (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  artifact_id text not null,
  evidence_version_id uuid not null,
  object_key_hash text not null,
  content_hash text not null,
  erased_by uuid not null references auth.users(id),
  reason text not null,
  receipt_hash text not null,
  erased_at timestamptz not null,
  primary key (organization_id, id),
  unique (organization_id, artifact_id, evidence_version_id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table extraction_runs (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  artifact_id text not null,
  evidence_version_id uuid not null,
  adapter_id text not null,
  prompt_version text,
  model_version text,
  parser_version text not null,
  status text not null check (status in ('RUNNING', 'VALIDATED', 'ABSTAINED', 'FAILED')),
  started_at timestamptz not null,
  completed_at timestamptz,
  receipt_hash text not null,
  primary key (organization_id, id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table extracted_fact_candidates (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  extraction_run_id uuid not null,
  subject_id text not null,
  property_name text not null,
  fact_value jsonb not null,
  unit text,
  valid_from timestamptz not null,
  valid_to timestamptz,
  observed_at timestamptz not null,
  imported_at timestamptz not null,
  origin text not null check (origin in ('AGENT', 'PARSER', 'HUMAN', 'API')),
  candidate_receipt_hash text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  foreign key (organization_id, extraction_run_id)
    references extraction_runs(organization_id, id)
);

create table temporal_facts (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  candidate_id uuid not null,
  subject_id text not null,
  property_name text not null,
  fact_value jsonb not null,
  unit text,
  valid_from timestamptz not null,
  valid_to timestamptz,
  observed_at timestamptz not null,
  imported_at timestamptz not null,
  materialized_at timestamptz not null,
  materialized_by text not null,
  authority text not null check (authority in ('HUMAN', 'DETERMINISTIC_VALIDATOR')),
  supersedes_fact_id uuid,
  receipt_hash text not null,
  primary key (organization_id, id),
  unique (organization_id, candidate_id),
  foreign key (organization_id, candidate_id)
    references extracted_fact_candidates(organization_id, id),
  foreign key (organization_id, supersedes_fact_id)
    references temporal_facts(organization_id, id)
);

create table candidate_sources (
  organization_id text not null,
  candidate_id uuid not null,
  source_index integer not null check (source_index >= 0),
  artifact_id text not null,
  evidence_version_id uuid not null,
  evidence_sha256 text not null,
  page integer,
  section text not null,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  primary key (organization_id, candidate_id, source_index),
  foreign key (organization_id, candidate_id)
    references extracted_fact_candidates(organization_id, id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table fact_sources (
  organization_id text not null,
  fact_id uuid not null,
  source_index integer not null check (source_index >= 0),
  artifact_id text not null,
  evidence_version_id uuid not null,
  evidence_sha256 text not null,
  page integer,
  section text not null,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  primary key (organization_id, fact_id, source_index),
  foreign key (organization_id, fact_id)
    references temporal_facts(organization_id, id),
  foreign key (organization_id, artifact_id, evidence_version_id)
    references evidence_versions(organization_id, artifact_id, id)
);

create table fact_conflicts (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  subject_id text not null,
  property_name text not null,
  left_fact_id uuid not null,
  right_fact_id uuid not null,
  state text not null check (state in ('OPEN', 'RESOLVED_BY_NEW_FACT')),
  detected_at timestamptz not null,
  receipt_hash text not null,
  primary key (organization_id, id),
  foreign key (organization_id, left_fact_id)
    references temporal_facts(organization_id, id),
  foreign key (organization_id, right_fact_id)
    references temporal_facts(organization_id, id)
);

create index evidence_versions_tenant_time_idx
  on evidence_versions (organization_id, created_at desc);
create index evidence_access_tenant_time_idx
  on evidence_access_events (organization_id, occurred_at desc);
create index temporal_facts_snapshot_idx
  on temporal_facts (organization_id, subject_id, property_name, valid_from, valid_to);
create index fact_conflicts_open_idx
  on fact_conflicts (organization_id, state) where state = 'OPEN';

alter table evidence_versions enable row level security;
alter table evidence_lifecycle_events enable row level security;
alter table evidence_access_events enable row level security;
alter table erasure_tombstones enable row level security;
alter table extraction_runs enable row level security;
alter table extracted_fact_candidates enable row level security;
alter table temporal_facts enable row level security;
alter table candidate_sources enable row level security;
alter table fact_sources enable row level security;
alter table fact_conflicts enable row level security;

revoke all on evidence_versions, evidence_lifecycle_events,
  evidence_access_events, erasure_tombstones, extraction_runs,
  extracted_fact_candidates, temporal_facts, candidate_sources, fact_sources,
  fact_conflicts
  from anon, authenticated;

create trigger evidence_versions_append_only
before update or delete on evidence_versions
for each row execute function prevent_append_only_mutation();
create trigger evidence_lifecycle_events_append_only
before update or delete on evidence_lifecycle_events
for each row execute function prevent_append_only_mutation();
create trigger evidence_access_events_append_only
before update or delete on evidence_access_events
for each row execute function prevent_append_only_mutation();
create trigger erasure_tombstones_append_only
before update or delete on erasure_tombstones
for each row execute function prevent_append_only_mutation();
create trigger extraction_runs_append_only
before update or delete on extraction_runs
for each row execute function prevent_append_only_mutation();
create trigger extracted_fact_candidates_append_only
before update or delete on extracted_fact_candidates
for each row execute function prevent_append_only_mutation();
create trigger temporal_facts_append_only
before update or delete on temporal_facts
for each row execute function prevent_append_only_mutation();
create trigger candidate_sources_append_only
before update or delete on candidate_sources
for each row execute function prevent_append_only_mutation();
create trigger fact_sources_append_only
before update or delete on fact_sources
for each row execute function prevent_append_only_mutation();
create trigger fact_conflicts_append_only
before update or delete on fact_conflicts
for each row execute function prevent_append_only_mutation();
