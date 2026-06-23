---
title: "arel-node-accessor-aliases"
status: draft
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: arel
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two arel node files miss a single alias accessor each, plus arel carries 3
advisory arity mismatches:

- `packages/arel/src/nodes/unary.ts` (3/4): `value` — Rails
  `vendor/rails/activerecord/lib/arel/nodes/unary.rb:7` `alias :value :expr`.
- `packages/arel/src/nodes/table-alias.ts` (7/8): `table_alias` — same file,
  `:8` `alias :table_alias :name` (TableAlias inherits Unary's aliases).

Both are pure Ruby aliases to an attribute (`expr` / `name`) that is already
ported. The TS host either needs the alias accessor or a skip entry.

The 3 arel arity mismatches are in `output/arity-mismatches.json` (regenerate
with `pnpm api:compare --package arel --arity`); converge each TS signature to
the Rails signature.

## Acceptance criteria

- `nodes/unary.ts` exposes `value` (getter aliasing `expr`) and
  `nodes/table-alias.ts` exposes `table_alias` (aliasing `name`), OR a
  `SKIP_GROUPS` entry with reason if trails deliberately omits the alias.
- The 3 arel arity mismatches converge (TS signature matches Rails) or are
  documented; `pnpm api:compare --package arel --arity` reports 0 arel arity
  mismatches.
- `pnpm api:compare --package arel` reports 100% (0 missing) overall.
