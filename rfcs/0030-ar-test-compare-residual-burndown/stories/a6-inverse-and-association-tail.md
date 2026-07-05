---
title: "A6 — inverse-of + bidirectional + collection tail"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 140
priority: 3
pr: 3411
claim: "2026-06-15T22:28:48Z"
assignee: "a6-inverse-and-association-tail"
blocked-by: "Blocked behind RFC 0019 canonical conversion of its target files (assoc-associations-test, assoc-has-many, inverse-associations-fixture-port, assoc-left-outer-join-canonical, bidirectional-destroy-dependent-cycle-guard). These files are still on require-canonical-schema-exclude.json; un-skipping here before they are canonical-converted would add bespoke-defineSchema debt. Unblock once those merge and the files are off the exclude list."
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). InverseOfAssociationRecursiveError class + bidirectional destroy + collection/singular tail in associations_test.

**18** `it.skip` tests to un-skip across 5 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **18** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/bidirectional-destroy-dependencies.ts or preloader.ts missing collection/singular semantics
- associations/has-many-associations.ts or preloader.ts missing has-many semantics
- associations/associations.ts or preloader.ts missing collection/singular semantics

### Skipped tests to un-skip

- `associations/inverse_associations_test.rb` → `associations/inverse-associations.test.ts` — **6** to un-skip:
  - recursive inverse on recursive model has many inversing
  - parent instance should be shared with every child on find for sti
  - inverse instance should be set before find callbacks are run
  - inverse instance should be set before initialize callbacks are run
  - has many and belongs to should find inverse automatically for model in module
  - inversed instance should load after autosave if it is not already loaded
- `associations/bidirectional_destroy_dependencies_test.rb` → `associations/bidirectional-destroy-dependencies.test.ts` — **1** to un-skip:
  - bidirectional dependence when destroying item with belongs to association
- `associations/has_many_associations_test.rb` → `associations/has-many-associations.test.ts` — **1** to un-skip:
  - ids on loaded association with custom primary key
- `associations/left_outer_join_association_test.rb` → `associations/left-outer-join-association.test.ts` — **1** to un-skip:
  - merging left joins should be left joins
- `associations_test.rb` → `associations.test.ts` — **9** to un-skip:
  - subselect
  - using limitable reflections helper
  - association with references
  - inspect does not reload a not yet loaded target
  - pretty print does not reload a not yet loaded target
  - save on parent saves children
  - proxy object can be stubbed
  - preload groups queries with same sql at second level
  - multi database polymorphic preload with same table name

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
- **`defineSchema` is canonical-only.** It may pass **only** the canonical
  `TEST_SCHEMA` (the `blazetrails/require-canonical-schema` ESLint rule enforces
  this). Never hand-roll a bespoke per-test schema or free table name. Prefer
  `useHandlerFixtures` / `setupHandlerSuite` on the default canonical tables over
  `defineSchema` wherever possible.
- **Gating — check the exclude list first.** If your target file is still listed
  in `eslint/require-canonical-schema-exclude.json` (grandfathered), it is **not
  yet canonical** and the lint is OFF for it — un-skipping there would pile new
  tests onto bespoke schema. That file's **RFC 0019 canonical conversion must land
  first** (it converts the file to `TEST_SCHEMA` + canonical models/fixtures and
  **removes the file from the exclude list**). Do not un-skip ahead of it. If the
  canonical schema/models genuinely lack something the test needs, that is a 0019
  gap to fill (add it to the canonical schema), never a reason to reintroduce a
  bespoke `defineSchema`.
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
