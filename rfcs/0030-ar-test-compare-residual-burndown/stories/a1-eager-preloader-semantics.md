---
title: "A1 — eager_test: preloader eager-loading semantics"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Largest single block. `associations/eager.ts` / `preloader.ts` miss eager-loading semantics (nested includes, join-for-count, STI, ordering).

Counted `test:compare` skips covered by this story: **59** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/eager.ts or preloader.ts missing eager-loading semantics

### Skipped tests to un-skip

- `associations/eager_test.rb` → `associations/eager.test.ts` — **59** counted skips:
  - loading polymorphic association with mixed table conditions
  - loading association with string joins
  - loading with scope including joins
  - loading association with same table joins
  - loading association with intersection joins
  - type cast in where references association name
  - attribute alias in where references association name
  - calculate with string in from and eager loading
  - with two tables in from without getting double quoted
  - string id column joins
  - preloading with has one through an sti with after initialize
  - eager with has many through an sti join model with conditions on both
  - eager count performed on a has many association with multi table conditional
  - eager count performed on a has many through association with multi table conditional
  - eager with has many and limit and conditions on the eagers
  - eager with has many and limit and scoped conditions on the eagers
  - eager with multi table conditional properly counts the records when using size
  - eager association with scope with joins
  - association loading notification
  - base messages
  - dont create temporary active record instances
  - order on join table with include and limit
  - eager loading with order on joined table preloads
  - eager loading with conditions on joined table preloads
  - preload has many with association condition and default scope
  - eager loading with conditions on string joined table preloads
  - eager loading with select on joined table preloads
  - eager loading with conditions on join model preloads
  - preloading polymorphic with custom foreign type
  - joins with includes should preload via joins
  - scoping with a circular preload
  - circular preload does not modify unscoped
  - preloading does not cache has many association subset when preloaded with a through association
  - works in combination with order(:symbol) and reorder(:symbol)
  - preloading with a polymorphic association and using the existential predicate but also using a select
  - preloading with a polymorphic association and using the existential predicate
  - preloading associations with string joins and order references
  - including associations with where.not adds implicit references
  - including association based on sql condition and no database column
  - preloading a polymorphic association with references to the associated table

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
