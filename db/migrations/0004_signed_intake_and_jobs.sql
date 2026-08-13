-- Signed canonical event intake, replay protection, durable receipts, and the
-- first bounded job ledger. Secrets remain in the deployment secret manager.

create table integration_credentials (
  organization_id text not null references organizations(id),
  key_id text not null,
  algorithm text not null check (algorithm = 'HMAC-SHA256'),
  status text not null check (status in ('ACTIVE', 'ROTATING', 'REVOKED')),
  secret_version text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  max_requests_per_minute integer not null check (max_requests_per_minute > 0),
  created_at timestamptz not null default now(),
  primary key (organization_id, key_id)
);

create table integration_nonces (
  organization_id text not null,
  key_id text not null,
  nonce text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, key_id, nonce),
  foreign key (organization_id, key_id)
    references integration_credentials(organization_id, key_id)
);

create table canonical_events (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  external_event_id text not null,
  source_system_id text not null,
  schema_version text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  observed_at timestamptz not null,
  correlation_id text not null,
  causation_id text,
  idempotency_key text not null,
  key_id text not null,
  content_digest text not null,
  envelope jsonb not null,
  received_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, source_system_id, external_event_id),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, key_id)
    references integration_credentials(organization_id, key_id)
);

create table job_ledger (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  event_record_id uuid not null,
  job_type text not null,
  status text not null check (
    status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'RETRY_SCHEDULED', 'DEAD_LETTER')
  ),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null check (max_attempts between 1 and 25),
  available_at timestamptz not null,
  locked_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  foreign key (organization_id, event_record_id)
    references canonical_events(organization_id, id)
);

create table event_receipts (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  event_record_id uuid not null,
  job_id uuid not null,
  idempotency_key text not null,
  outcome text not null check (outcome in ('ACCEPTED', 'REJECTED')),
  receipt_hash text not null,
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, idempotency_key, outcome),
  foreign key (organization_id, event_record_id)
    references canonical_events(organization_id, id),
  foreign key (organization_id, job_id)
    references job_ledger(organization_id, id)
);

create index canonical_events_tenant_time_idx
  on canonical_events (organization_id, received_at desc);
create index job_ledger_claim_idx
  on job_ledger (status, available_at) where status in ('PENDING', 'RETRY_SCHEDULED');
create index event_receipts_tenant_time_idx
  on event_receipts (organization_id, received_at desc);

alter table integration_credentials enable row level security;
alter table integration_nonces enable row level security;
alter table canonical_events enable row level security;
alter table job_ledger enable row level security;
alter table event_receipts enable row level security;

revoke all on integration_credentials, integration_nonces, canonical_events,
  job_ledger, event_receipts from anon, authenticated;

create trigger canonical_events_append_only
before update or delete on canonical_events
for each row execute function prevent_append_only_mutation();
create trigger event_receipts_append_only
before update or delete on event_receipts
for each row execute function prevent_append_only_mutation();
