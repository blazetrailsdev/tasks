---
title: "port-remaining-persistence-test-cases-deviations"
status: ready
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `port-remaining-persistence-test-rails-cases` (PR that ported 29 of
the 34 missing `def test_*` from
`vendor/rails/activerecord/test/cases/persistence_test.rb` into
`packages/activerecord/src/persistence.test.ts`). Five Rails cases were left
unported because each surfaces a real trails deviation / needs adapter-specific
schema, and porting them would either bend the test or exceed the PR's scope.
This story completes AC #2 (0 missing) for persistence_test.rb.

### Impl-gap cases (fix impl to match Rails, or track under 0023-surfaced-deviations)

1. **increment aliased attribute** (persistence_test.rb:301) — `increment!(:available_credit)`
   where `available_credit` is `alias_attribute`'d to `credit_limit`. trails'
   `increment`/`incrementBang` (persistence.ts:435/466) do NOT resolve attribute
   aliases: `readAttribute`/`writeAttribute` and `updateCounters` use the raw name,
   so the counter write targets a non-existent `availableCredit` column and the
   value never persists. Fix: resolve `_attributeAliases` in the increment path
   (Rails' `increment!` resolves via `read_attribute`/`[]`).

2. **update attribute in before validation respects callback chain** (persistence_test.rb:813)
   — Rails' `before_validation :set_author_name` calls `update_attribute` (a DB
   write) inside validation. trails validations are SYNC-only (see
   `feedback_trails_validations_are_sync_only`): an async `beforeValidation` throws
   "Async callback on sync chain". Needs a sync-compatible port or a decision on
   whether trails supports async work in before_validation.

3. **persist inherited class with different table name** (persistence_test.rb:1451)
   — anon `Minimalistic` subclass on the `aircraft` table; asserts
   `Aircraft.last.name`. Blocked by the restricted-`name`-attribute deviation
   (`project_restricted_name_attribute_no_dirty_track`): `create({ name })` and
   `record.name = ...` don't persist/dirty-track `name`, so `Aircraft.last.name`
   is null. Converge with the restricted-name work.

### Adapter-specific schema cases (need Default / PkAutopopulated tables + triggers)

1. **fills auto populated columns on creation** (persistence_test.rb:67/95/108) —
   adapter-specific (`if current_adapter?(:PostgreSQLAdapter)` / SQLite3 / Mysql2).
   Needs the `Default` model's adapter-specific table (defined in
   `*_specific_schema.rb`, NOT canonical schema.rb) with defaulted columns
   (`ruby_on_rails`, `random_number`, `modified_date`/`modified_time*`, etc.).
   Model exists (`test-helpers/models/default.ts`) but the table does not. Set it
   up per-adapter in a `beforeAll` gated on `adapterType`, like the existing
   uuid-pk block (persistence.test.ts ~1442).

2. **model with no auto populated fields still returns primary key after insert**
   (persistence_test.rb:1609) — gated `supports_insert_returning? && !SQLite3`.
   Needs `pk_autopopulated_by_a_trigger_records` table + a DB trigger that
   populates the PK (adapter-specific schema). Model exists
   (`test-helpers/models/pk-autopopulated-by-a-trigger-record.ts`); the trigger
   setup does not.

## Acceptance criteria

- [ ] All 5 cases above have faithful ports in `persistence.test.ts` (test names
      verbatim; verify with test:compare — 0 missing for persistence_test.rb).
- [ ] Impl gaps (1–3) fixed to match Rails, or filed as tracked-pending-convergence
      under 0023-surfaced-deviations with the failing test skipped ONLY if the
      deviation story is registered.
- [ ] Adapter-specific tables (4–5) set up via canonical/adapter-specific schema
      helpers gated on `adapterType`; no bespoke free tables.
- [ ] Adapter gating matches Rails verbatim.
