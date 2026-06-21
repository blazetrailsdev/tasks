---
title: "partial-inserts-locking-column-default-col-init-seed"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from PR #3826 review (story
`partial-inserts-locking-column-init-time-seed`).

PR #3826 closes the in-memory locking-column fidelity gap **only** for models
that explicitly configured a custom locking column via `set_locking_column`
(own `_lockingColumn` property) — e.g. `LockPersonalLegacyThing` (`version`).
It deliberately does NOT fire for the common default-column case
(`lock_version`), because the gate would otherwise match every model (each
inherits `static _lockingColumn = "lock_version"`) and force a sync schema
reflection at first `new` for the whole model set — the schema-cache-warming
blast radius tracked under RFC 0030/0031.

Rails reflects the locking column's default (`0`) into every new record at class
load via `load_schema!` precomputing `_default_attributes`
(`model_schema.rb:587-596`, `LockingType#deserialize(nil) → nil.to_i → 0`,
`optimistic.rb:211-213`). So a plain optimistic-locking model that has a real
`lock_version` DB column but never declared it via `attribute()` still reads
`Model.new.lock_version == nil` in trails before its first query, vs Rails' `0`.
The insert-time seed from #3815 covers the **persisted** value, so this is an
in-memory-only divergence in the window between `new` and the first DB
interaction (benign in practice, but a real deviation).

trails impl: `packages/activerecord/src/attributes.ts` `_defaultAttributes`
(the own-`_lockingColumn` gate added by #3826). Rails:
`vendor/rails/activerecord/lib/active_record/model_schema.rb:534-596`,
`.../locking/optimistic.rb:159-213`.

## Acceptance criteria

- [ ] `Model.new.lock_version == 0` in memory before any save for a plain
      optimistic-locking model whose `lock_version` column is undeclared via
      `attribute()` and that is `new`'d before its first schema load.
- [ ] No regression to the schema-cache-warming campaign (RFC 0030/0031): the
      fix must not eagerly reflect models that have no locking column, or it
      must be reconciled with that work rather than fighting it.
- [ ] `locking.test.ts` stays green under both `partial_inserts` settings.
