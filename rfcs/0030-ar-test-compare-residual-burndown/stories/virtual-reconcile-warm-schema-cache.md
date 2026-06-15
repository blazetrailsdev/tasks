---
title: "Memoize schema cache when virtual reconciliation reflects on cold cache"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From f9g2-attributes-virtual-columns (PR #3182). On the write path,
`reconcileVirtualAttributes(reflect: true)` resolves the table's real columns
via `reflectColumnNames`, which falls back to `connection.columns(table)` when
the schema cache is cold (`model-schema.ts`). That call fetches columns but does
**not** populate the shared schema cache (`getCachedColumnsHash` /
`isCached`), so a model whose schema was never reflected (e.g. declared entirely
via `attribute()` under `AR_NO_AUTO_SCHEMA`) re-issues the introspection query on
**every** save instead of once.

This is correctness-neutral and does not affect production models (the schema
cache is warm after boot/first query), but it is a needless per-write query in
the cold-cache path.

## Scope

Populate the shared schema cache when reconciliation reflects on a cold cache —
e.g. resolve columns through `schemaCache.columnsHash(pool, table)` (which
memoizes) rather than the raw `connection.columns(table)` — so subsequent
writes hit the warm cache and reconcile becomes a no-op query-wise.

Acceptance: a second save on a cold-cache model that declared a virtual
`attribute()` issues no additional schema-introspection query.

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
