---
title: "Convert unconverted Tier-1 files to canonical fixtures (opportunistic)"
status: in-progress
updated: 2026-06-07
rfc: "0014-fixtures-adoption"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 52
pr: 2991
claim: "2026-06-07T02:30:57Z"
assignee: "tier1-opportunistic-conversion"
blocked-by: null
---

## Context

The adoption inventory flags a small pool of **Tier-1** (mechanically
convertible) test files that don't yet use `useFixtures`. This is the only
pickable fixtures-adoption work; the broader sweep is a non-goal (RFC §Non-goals).
Low priority — pick up only when a PR is already touching one of these files. The
target is **Rails' fixtures shape**, which our helpers mirror 1:1 (RFC §Do as
Rails does).

## Method (per file, the Rails / #2766 shape)

1. Replace the file's inline `class X extends Base` + `beforeAll(defineSchema)`
   with **canonical models** + the canonical `TEST_SCHEMA`
   (`test-helpers/test-schema.ts`, seeded once by `globalSetup` — no per-file
   DDL).
2. Register fixtures in `test-helpers/fixtures-registry.ts` (≙ Rails
   `test/fixtures/*.yml` + `ActiveRecord::FixtureSet`).
3. In the test, `useHandlerFixtures(...)` (`use-handler-fixtures.ts:45`) ≙ Rails
   class-level `fixtures :name` + `use_transactional_tests`
   (`activerecord/lib/active_record/test_fixtures.rb`); reference rows via the
   `name(:label)` accessor ≙ Rails' generated fixture accessor.
4. Delete the now-redundant DDL; the row data flows from the registry, not
   `Model.create()` calls in `beforeEach`.

## Acceptance criteria

- [ ] **Re-run `pnpm fixtures:adoption:inventory`** (`package.json:24`) for the
      **current** unconverted Tier-1 list — committed counts are as-of-generation
      and several have since been ported (locking, dirty, errors…).
- [ ] Each remaining Tier-1 file touched is converted via the §Method shape
      above (canonical model + `fixtures :name` registry + `name(:label)`
      lookup), **not** a shallow `beforeAll(defineSchema)` trim (the #2764
      anti-pattern).
- [ ] Redundant per-file DDL removed; the file rides `TEST_SCHEMA` (cache-hit,
      no `CREATE` — `define-schema.ts:487` `seedSchemaSignatures`).
- [ ] Green on all three drivers (sqlite / postgres / mysql).
- [ ] Tier-3 / Tier-4 files **not** touched (out of scope).
- [ ] A candidate already converted upstream is struck from the list, not
      re-converted.

## Notes

Cap **300 LOC per PR**. Gold standard: PR #2766 (PessimisticLocking) and #2788
(sqlite3 explain → canonical Author + fixtures). Anti-pattern: #2764 (boilerplate
trim only). This is an opportunistic, low-priority chore — do not batch it into a
standalone sweep (that's the explicit non-goal).
