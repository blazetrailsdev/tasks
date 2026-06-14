---
title: "Memoize schema cache when virtual reconciliation reflects on cold cache"
status: ready
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
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
