---
title: "timestamp: index is created for both timestamps (fixture-dependent)"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

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
