---
title: "A3 — has_one + has_one_through residuals"
status: done
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 230
priority: null
pr: 3409
claim: "2026-06-15T20:20:26Z"
assignee: "a3-has-one-and-through"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). has-one / has-one-through loader gaps (disable_joins variant + base through).

**29** `it.skip` tests to un-skip across 3 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **29** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/has-one-associations.ts or preloader.ts missing has-one semantics
- associations/has-one-through-disable-joins-associations.ts or preloader.ts missing has-one-through semantics

### Skipped tests to un-skip

- `associations/has_one_associations_test.rb` → `associations/has-one-associations.test.ts` — **22** to un-skip:
  - restrict with error with locale
  - build and create should not happen within scope
  - create with inexistent foreign key failing
  - reload association with query cache
  - finding with interpolated condition
  - has one proxy should not respond to private methods
  - has one proxy should respond to private methods via send
  - creation failure replaces existing without dependent option
  - creation failure replaces existing with dependent option
  - replacement failure due to existing record should raise error
  - replacement failure due to new record should raise error
  - association keys bypass attribute protection
  - association protect foreign key
  - has one autosave with primary key manually set
  - with polymorphic has one with custom columns name
  - polymorphic has one with touch option on create wont cache association so fetching after transaction commit works
  - polymorphic has one with touch option on update will touch record by fetching from database if needed
  - has one with touch option on touch
  - has one with touch option on empty update
  - association enum works properly
  - association enum works properly with nested join
  - has one with touch option on nonpersisted built associations doesnt update parent
- `associations/has_one_through_disable_joins_associations_test.rb` → `associations/has-one-through-disable-joins-associations.test.ts` — **5** to un-skip:
  - counting on disable joins through
  - nil on disable joins through
  - preload on disable joins through
  - has one through with belongs to on disable joins
  - disable joins through with enum type
- `associations/has_one_through_associations_test.rb` → `associations/has-one-through-associations.test.ts` — **2** to un-skip:
  - has one through proxy should not respond to private methods
  - has one through proxy should respond to private methods via send

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
