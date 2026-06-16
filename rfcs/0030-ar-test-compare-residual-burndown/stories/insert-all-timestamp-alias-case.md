---
title: "insert_all timestamp-alias resolution is snake_case-only"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in d2-insert-all-on-duplicate (PR #3442). `InsertAll`'s
`_physicalTimestampCols` (packages/activerecord/src/insert-all.ts) resolves the
magic timestamp columns (`created_at`/`updated_at`/...) through the model's
alias map using **snake_case** keys. The canonical `Developer`
(test-helpers/models/developer.ts) aliases them in **camelCase**
(`createdAt` → `legacyCreatedAt`), so the lookup misses and no timestamp is
seeded into `legacy_created_at` etc. on insert/upsert.

Blocks `upsert all implicitly sets timestamps even when columns are aliased` in
packages/activerecord/src/insert-all.test.ts (currently `it.skip`), mirroring
Rails insert_all_test.rb:666.

## Acceptance criteria

- [ ] `_physicalTimestampCols` resolves timestamp aliases regardless of the
      alias key's case (or the canonical Developer aliases are snake_case).
- [ ] Un-skip `upsert all implicitly sets timestamps even when columns are
aliased`; passes on SQLite.
