---
title: "A5 — cascaded eager + nested-include + full-STI-class"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 3407
claim: "2026-06-15T20:33:56Z"
assignee: "a5-cascaded-and-sti-eager"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Cascaded/recursive eager loading + STI-class eager-load + nested include grafting.

**18** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **22** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/cascaded-eager-loading.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-includes-full-sti-class.ts or preloader.ts missing eager-loading semantics
- associations/eager-load-nested-include.ts or preloader.ts missing eager-loading semantics

### Skipped tests to un-skip

- `associations/cascaded_eager_loading_test.rb` → `associations/cascaded-eager-loading.test.ts` — **12** to un-skip:
  - eager association loading with hmt does not table name collide when joining associations
  - eager association loading grafts stashed associations to correct parent
  - cascaded eager association loading with join for count
  - cascaded eager association loading with duplicated includes
  - cascaded eager association loading with twice includes edge cases
  - eager association loading with join for count
  - eager association loading with cascaded three levels by ping pong
  - eager association loading with multiple stis and order
  - eager association loading with recursive cascading four levels has many through
  - eager association loading with recursive cascading four levels has and belongs to many
  - preloading across has one constrains loaded records
  - preloading across has one through constrains loaded records
- `associations/eager_load_includes_full_sti_class_test.rb` → `associations/eager-load-includes-full-sti-class.test.ts` — **4** to un-skip:
  - class names
  - class names with includes
  - class names with eager load
  - class names with find by
- `associations/eager_load_nested_include_test.rb` → `associations/eager-load-nested-include.test.ts` — **2** to un-skip:
  - include query
  - missing data in a nested include should not cause errors when constructing objects

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
