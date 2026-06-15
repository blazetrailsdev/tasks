---
title: "B3 — relation select + multi-join table aliasing"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "relation-scoping"
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 3416
claim: "2026-06-15T22:46:28Z"
assignee: "b3-relation-select-joins"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). joins(:a, :a_with_extend) per-join table aliasing + relation parity tail.

**17** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **16** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation.ts or abstract-adapter.ts missing Rails parity for database_statements

### Skipped tests to un-skip

- `relation/select_test.rb` → `relation/select.test.ts` — **8** to un-skip:
  - select with hash and table alias
  - select with hash argument with few tables
  - reselect with default scope select
  - merging select from different model
  - type casted extra select with eager loading
  - aliased select using as with joins and includes
  - aliased select not using as with joins and includes
  - star select with joins and includes
- `relations_test.rb` → `relations.test.ts` — **7** to un-skip:
  - where id with delegated ar object
  - where relation with delegated ar object
  - select returns records with projected columns in SQL
  - select limits returned columns
  - reverseOrder flips ASC to DESC
  - reverseOrder flips DESC to ASC
  - finding with arel sql order
- `database_statements_test.rb` → `database-statements.test.ts` — **2** to un-skip:
  - insert should return the inserted id
  - create should return the inserted id

## Test-writing direction

Write **Rails-faithful tests** — fidelity to the upstream Rails suite is the #1
priority, not green checkmarks:

- **Read the corresponding Rails test first** (`activerecord/test/cases/...`) and
  mirror its structure, models, and assertions. Never reword or rename a test.
- **Use the official/canonical schema** (`TEST_SCHEMA`, which mirrors Rails'
  `schema.rb`) and the **official canonical models** in
  `packages/activerecord/src/test-helpers/models/` — there are ~200 already ported
  (Author, Post, Tag, Tagging, Comment, Category, Categorization, and many more),
  matching Rails' `activerecord/test/models/`. Do **not** create your own custom
  tables or models: **table, column, and model names must match Rails exactly.**
  If Rails uses `Author`/`authors`, use the canonical `Author` model and `authors`
  table — never rename it, hand-roll a stand-in, or substitute a bespoke one.
- **Use `useHandlerFixtures`** for fixture-backed setup — the one-call wiring that
  mirrors Rails' `fixtures :name` + transactional tests. Look up the real
  fixtures Rails uses instead of hand-building records.
- **Move away from `defineSchema`** / bespoke per-test schemas. If the canonical
  schema seems to lack something, mirror Rails' own setup (canonical model +
  fixture) rather than hand-rolling a schema.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  behavior (an implementation gap, missing feature, or genuine divergence), do
  **not** contort the test, schema, or assertion to force it green. Leave it
  `it.skip` with a `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story**
  via `pnpm tasks new <rfc-slug> <story-slug>` so the gap is tracked and converged
  separately. Always converge to Rails — never ratify a deviation.

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
