-- V2: ML feature signals on items
alter table "items"
  add column if not exists "added_day_of_week"   smallint,
  add column if not exists "session_items_count" smallint default 1,
  add column if not exists "price_vs_cat_avg"    real,
  add column if not exists "category_slug"       text,
  add column if not exists "source_platform"     text default 'unknown',
  add column if not exists "outcome"             text check (outcome in ('regretted', 'happy', 'neutral')),
  add column if not exists "outcome_set_at"      timestamptz;

-- Index for ML training queries (only rows with an outcome label)
create index if not exists items_outcome_idx
  on items (user_id, outcome)
  where outcome is not null;

-- V2: rate limiting for model training
alter table "profiles"
  add column if not exists "last_model_trained_at" timestamptz;
