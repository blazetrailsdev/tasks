---
title: "A1 — eager_test: preloader eager-loading semantics"
status: claimed
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 470
priority: null
pr: null
claim: "2026-06-15T20:10:22Z"
assignee: "a1-eager-preloader-semantics"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Largest single block. `associations/eager.ts` / `preloader.ts` miss eager-loading semantics (nested includes, join-for-count, STI, ordering).

**59** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **59** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/eager.ts or preloader.ts missing eager-loading semantics

### Skipped tests to un-skip

- `associations/eager_test.rb` → `associations/eager.test.ts` — **59** to un-skip:
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
  - eager-loading a polymorphic association with references to the associated table
  - preloading belongs_to association associated by a composite query_constraints
  - preloading belongs_to association SQL
  - preloading has_many association associated by a composite query_constraints
  - preloading has_many through association associated by a composite query_constraints
  - preloading belongs_to CPK model with one of the keys being shared between models
  - preloading too many ids
  - eager loading too many ids
  - eager with has one through join model with conditions on the through
  - loading with one association with non preload
  - loading with multiple associations
  - loading from an association that has a hash of conditions
  - eager with has one dependent does not destroy dependent
  - preconfigured includes with belongs to
  - preconfigured includes with has many
  - preload belongs to uses exclusive scope
  - preload has many uses exclusive scope
  - preload has one using primary key
  - include has one using primary key

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
