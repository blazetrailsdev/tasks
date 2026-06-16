---
title: "D3 — nested-attributes: CPK + before_add callback timing"
status: in-progress
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "persistence"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3451
claim: "2026-06-16T12:11:00Z"
assignee: "d3-nested-attributes-cpk-callbacks"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). Reopens f6. Composite-primary-key support in the test adapter + Phase-G before_add-at-assignment callback timing.

**15** `it.skip` tests to un-skip across 2 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **22** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment in the test file._

### Skipped tests to un-skip

- `nested_attributes_test.rb` → `nested-attributes.test.ts` — **7** to un-skip:
  - should modify an existing record if there is a matching composite id
  - first and array index zero methods return the same value when nested attributes are set to update existing record
  - updating models with cpk provided as strings
  - should update existing records with non standard primary key
  - attr accessor of child should be value provided during update
  - should take a hash with composite id keys and assign the attributes to the associated models
  - circular references do not perform unnecessary queries
- `nested_attributes_with_callbacks_test.rb` → `nested-attributes-with-callbacks.test.ts` — **8** to un-skip:
  - :before_add called for new bird when not loaded
  - :before_add called for new bird when loaded
  - :before_add not called for identical assignment when not loaded
  - :before_add not called for identical assignment when loaded
  - :before_add not called for destroy assignment when not loaded
  - :before_add not called for deletion assignment when loaded
  - Assignment updates records in target when not loaded
  - Assignment updates records in target when loaded

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
