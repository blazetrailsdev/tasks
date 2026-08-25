---
title: "lockingEnabled must honour lock_optimistically (converge to locking_enabled?)"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: 4048
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while implementing `partial-inserts-locking-column-schema-default-init`
(PR #3815).

trails' `lockingEnabled` (`packages/activerecord/src/locking/optimistic.ts:37-39`)
returns simply:

    return modelClass._attributeDefinitions.has(lockingColumn(modelClass));

Rails' `Locking::Optimistic::ClassMethods#locking_enabled?` (optimistic.rb) is:

    def locking_enabled?
      lock_optimistically && columns_hash[locking_column]
    end

trails omits the `lock_optimistically` conjunct. The setting exists and is
honoured elsewhere — `hookAttributeType` wraps the lock column in `LockingType`
only when `this.lockOptimistically !== false` (optimistic.ts:310-313) — but
`lockingEnabled` ignores it. So a model with `lock_optimistically = false` but a
`lock_version`/custom locking column still reports `lockingEnabled === true`,
which drives the unconditional locking-column union in `attributesForCreate`,
the `_update_row`/`_query_constraints_hash` version checks, the insert-time
schema-default seed (PR #3815), `updateCounters` lock bump, etc. — all of which
Rails would skip when optimistic locking is disabled.

## Acceptance criteria

- [ ] `lockingEnabled` returns false when `lock_optimistically` is false, even if
      the locking column is present — matching Rails `locking_enabled?`
      (`lock_optimistically && columns_hash[locking_column]`).
- [ ] A model with `lock_optimistically = false` does not force the locking
      column into INSERT candidates, does not seed it at insert, and does not add
      the version check to UPDATE/destroy.
- [ ] Existing locking tests stay green (default `lock_optimistically = true`).
