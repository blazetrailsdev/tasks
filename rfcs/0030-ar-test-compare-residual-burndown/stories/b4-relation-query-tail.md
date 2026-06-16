---
title: "B4 — relation query tail (with/where_chain/update_all/predicate/batches)"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "relation-scoping"
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3424
claim: "2026-06-15T23:46:28Z"
assignee: "b4-relation-query-tail"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Assorted relation parity: CTE with, where_chain, update_all, scoped-belongs_to predicate, batches, null relation.

**9** `it.skip` tests to un-skip across 7 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **10** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation/where-chain.ts#WhereChain missing or incomplete Rails parity
- relation/update-all.ts or relation.ts missing Rails parity for this query feature

### Skipped tests to un-skip

- `relation/with_test.rb` → `relation/with.test.ts` — **2** to un-skip:
  - raises when using block
  - common table expressions are unsupported
- `relation/where_test.rb` → `relation/where.test.ts` — **0** un-skip targets (file's 1 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `relation/where_chain_test.rb` → `relation/where-chain.test.ts` — **1** to un-skip:
  - rewhere with polymorphic association
- `relation/update_all_test.rb` → `relation/update-all.test.ts` — **1** to un-skip:
  - touch all with custom timestamp
- `relation/predicate_builder_test.rb` → `relation/predicate-builder.test.ts` — **1** to un-skip:
  - registering new handlers for joins
- `batches_test.rb` → `batches.test.ts` — **3** to un-skip:
  - find in batches should quote batch order
  - find in batches should ignore the order default scope
  - .find_each respects table alias
- `null_relation_test.rb` → `null-relation.test.ts` — **1** to un-skip:
  - none chainable to existing scope extension method

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
