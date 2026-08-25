---
title: "Migrator holds _adapter instead of Rails' connection reader"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 90
pr: 6121
claim: "2026-08-05T09:30:01Z"
assignee: "rename-relation-modelclass-field-to-model"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while deleting the drained `SchemaContext` (PR #5801). Removing the
DSL's `this.connection...` call sites unmasked a wide call-mismatch:
`Migrator#with_advisory_lock` omits Rails' `connection`. It was baselined as a
bucket-(b) equivalent (same operation, one fewer hop), but the missing reader is
a real shape divergence.

Rails' `Migrator` reaches the connection through a reader on every use —
`with_advisory_lock` (`vendor/rails/activerecord/lib/active_record/migration.rb:1600-1613`)
calls `connection.get_advisory_lock(lock_id)` and
`connection.release_advisory_lock(lock_id)`; `use_advisory_lock?`,
`use_transaction?`, `ddl_transaction` and
`generate_migrator_advisory_lock_id` read `connection` the same way.

Trails' `Migrator` (`packages/activerecord/src/migration.ts`) instead stores the
adapter as a private field `_adapter` and calls
`adapter.getAdvisoryLock(...)` / `adapter.releaseAdvisoryLock(...)` directly
from `_withAdvisoryLock`. There is no `connection` reader, so every Rails call
site that goes through one shows up as an omitted call. Five wide
call-mismatch entries record it (`use_transaction?`, `use_advisory_lock?`,
`with_advisory_lock`, `generate_migrator_advisory_lock_id`, `reverting?` — see
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration.json`).

Note the public `withAdvisoryLock` wrapper (`migration.ts`) delegates to the
private `_withAdvisoryLock`, which is where the adapter calls actually live —
whichever method keeps the Rails name has to be the one that reads `connection`.

## Acceptance criteria

- `Migrator` exposes a `connection` reader mirroring Rails', and the advisory
  lock / transaction / lock-id methods read through it instead of touching
  `_adapter` directly.
- The wrapper/private split does not hide the reader from parity:api — the
  method carrying the Rails name is the one making the `connection` call.
- The affected entries are removed from the wide call-mismatch baseline
  (only-shrink); any that remain keep a real reason, not the seeded default.
- No behaviour change: advisory-lock tests stay green on all three lanes
  (note advisory-lock tests skip on sqlite).
