---
title: "column_names sync introspection excludes virtual attributes (cold cache)"
status: claimed
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-14T17:06:34Z"
assignee: "columnnames-sync-virtual-exclusion"
blocked-by: null
---

## Context

Spun out of f9g2-attributes-virtual-columns (PR #3182). That PR makes virtual
attributes — declared via `attribute()` with no backing DB column — excluded
from INSERT/UPDATE and from `columnNames()` **after** schema reflection has run
(`reconcileVirtualAttributes`, invoked from `ensureSchemaLoaded`).

A residual fidelity gap remains: a **synchronous** `Model.columnNames()` called
before any reflection, while the adapter schema cache is cold, still includes a
virtual `attribute()`. `columnsHash()` synthesizes a column view from
`_attributeDefinitions` in that case (`model-schema.ts:207-222`), and with no DB
access available synchronously it cannot distinguish a virtual attribute from a
real column.

In Rails, `column_names` is always `columns.map(&:name)`
(`model_schema.rb:477-480`) and the first call performs a **synchronous**,
blocking schema load — so this state never arises. trails' DB layer is async,
so the equivalent load is `ensureSchemaLoaded()`.

This is **pre-existing** (before #3182 there was no virtual marking at all, so
sync `columnNames()` always included phantom `attribute()` declarations) and
does not block persistence, which always awaits `ensureSchemaLoaded`.

## Scope

Make the class-level column introspection path itself DB-faithful without
requiring a prior `await ensureSchemaLoaded()`. Candidate approaches:

- Eagerly populate the adapter schema cache at connection/boot (so
  `isCached(table)` is true before any query and `columnsHash()` takes the
  cached, DB-sourced branch). This is the closest analogue to Rails'
  `schema_cache.yml` / synchronous reflection.
- Or stop synthesizing user-declared `attribute()` entries as columns when a
  live connection + real table exist, deferring to the reflected set.

Acceptance: a synchronous `Model.columnNames()` excludes virtual attributes for
a connected model with a real table, matching Rails' `columns.map(&:name)`.
