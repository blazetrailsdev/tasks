---
title: "Unify instantiateFromRows parent-key accessor (readAttribute vs _readAttribute, raw vs cast)"
status: draft
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: null
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

In Rails' `JoinDependency#instantiate`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:139`),
parent rows are grouped by the base node's key columns read **uniformly** out of
the aliased `row_hash` via `aliases.column_alias` — a single, consistent
accessor for both the top-level grouping key and the per-node `construct`
identity (`join_dependency.rb:144`, `:256`).

trails' row-reconstruction path (the `instantiateFromRows` / `construct`
equivalent in `packages/activerecord/src/associations/join-dependency.ts`, being
converged under the sibling story `converge-instantiate-construct`) is at risk of
reading the parent key inconsistently — e.g. `readAttribute` (cast value) in one
spot vs `_readAttribute`/raw column value in another, or model-instance accessor
vs raw `row[alias]`. Because the grouping/dedup keys land in a JS `Map`/object,
any mismatch between how the key is **written** (when seeding `seen`) and how it
is **read** (when looking up) silently breaks dedupe: the same logical parent
gets two entries, duplicating eager-loaded children, or distinct parents collide.

This story unifies the parent-key accessor so the value used to key the
associations/`seen` map is derived the same way on write and read (matching
Rails' single `column_alias`-based path), removing the raw-vs-cast /
`readAttribute`-vs-`_readAttribute` divergence.

`converge-instantiate-construct` (PR #3272, **merged**) already landed the
`instantiateFromRows` trio this story refers to, so this is unblocked and tunes
the existing parent-key accessor on that path.

## Acceptance criteria

- [ ] The parent/base key used to group rows and to key the `seen` /
      associations map is read through a single accessor, consistent between the
      seed and the lookup (mirror Rails' uniform `aliases.column_alias(node, col)`
      read; pick raw vs cast to match Rails, documented inline).
- [ ] No remaining mix of `readAttribute` vs `_readAttribute` (or
      model-accessor vs raw `row[alias]`) on the key path.
- [ ] Add/keep an eager-load test with duplicate join rows (one parent, many
      children, and the multi-parent case) proving dedupe is exact; read the
      corresponding Rails `eager`/`join_dependency` test and mirror names
      verbatim.
- [ ] CI green on all three adapters; api:compare / test:compare delta
      non-negative.
