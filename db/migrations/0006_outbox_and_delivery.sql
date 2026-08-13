-- Transactional outbound delivery, allowlisted endpoints, attempts, dead letters,
-- and append-only replay receipts. Endpoint secrets stay in the secret manager.

create table integration_endpoints (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  endpoint_name text not null,
  url text not null,
  allowed_hosts text[] not null,
  secret_reference text not null,
  secret_version text not null,
  status text not null check (status in ('ACTIVE', 'PAUSED', 'REVOKED')),
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, endpoint_name)
);

create table outbox_events (
  organization_id text not null references organizations(id),
  id uuid not null default gen_random_uuid(),
  endpoint_id uuid,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  schema_version text not null,
  idempotency_key text not null,
  correlation_id text not null,
  payload jsonb not null,
  status text not null check (
    status in ('PENDING', 'RETRY_SCHEDULED', 'DELIVERED', 'DEAD_LETTER')
  ),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null check (max_attempts between 1 and 25),
  available_at timestamptz not null,
  locked_at timestamptz,
  delivered_at timestamptz,
  receipt_hash text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, idempotency_key),
  foreign key (organization_id, endpoint_id)
    references integration_endpoints(organization_id, id)
);

create table delivery_attempts (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  outbox_event_id uuid not null,
  attempt_number integer not null check (attempt_number > 0),
  destination_host text not null,
  outcome text not null,
  response_status integer,
  error_code text,
  receipt_hash text not null,
  attempted_at timestamptz not null,
  primary key (organization_id, id),
  unique (organization_id, outbox_event_id, attempt_number),
  foreign key (organization_id, outbox_event_id)
    references outbox_events(organization_id, id)
);

create table dead_letters (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  outbox_event_id uuid not null,
  final_error_code text not null,
  failed_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, outbox_event_id),
  foreign key (organization_id, outbox_event_id)
    references outbox_events(organization_id, id)
);

create table dead_letter_replays (
  organization_id text not null,
  id uuid not null default gen_random_uuid(),
  dead_letter_id uuid not null,
  outbox_event_id uuid not null,
  replayed_by uuid not null references auth.users(id),
  replayed_at timestamptz not null,
  replay_receipt_hash text not null,
  primary key (organization_id, id),
  foreign key (organization_id, dead_letter_id)
    references dead_letters(organization_id, id),
  foreign key (organization_id, outbox_event_id)
    references outbox_events(organization_id, id)
);

create index outbox_claim_idx
  on outbox_events (status, available_at)
  where status in ('PENDING', 'RETRY_SCHEDULED');
create index delivery_attempts_tenant_time_idx
  on delivery_attempts (organization_id, attempted_at desc);

alter table integration_endpoints enable row level security;
alter table outbox_events enable row level security;
alter table delivery_attempts enable row level security;
alter table dead_letters enable row level security;
alter table dead_letter_replays enable row level security;

revoke all on integration_endpoints, outbox_events, delivery_attempts,
  dead_letters, dead_letter_replays from anon, authenticated;

create trigger delivery_attempts_append_only
before update or delete on delivery_attempts
for each row execute function prevent_append_only_mutation();
create trigger dead_letters_append_only
before update or delete on dead_letters
for each row execute function prevent_append_only_mutation();
create trigger dead_letter_replays_append_only
before update or delete on dead_letter_replays
for each row execute function prevent_append_only_mutation();
