---
title: "Port aggregate_reflections from a Map to a plain hash so add_aggregate_reflection can call merge"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Port `aggregate_reflections` from a JS `Map` to a plain hash so `add_aggregate_reflection` can call `merge`

## Context

Left as a reviewed baseline row by PR #6838
(`scripts/api-compare/call-mismatches-exclude/activerecord/reflection.json`,
`add_aggregate_reflection -> merge`).

**Rails** (`activerecord/lib/active_record/reflection.rb:29-31`):

    def add_aggregate_reflection(ar, name, reflection)
      ar.aggregate_reflections = ar.aggregate_reflections.merge(name.to_sym => reflection)
    end

`aggregate_reflections` is a `class_attribute` holding a Hash
(`activerecord/lib/active_record/reflection.rb:12`), and the body is a
non-mutating `Hash#merge` reassigned onto the class — the same shape
`add_reflection` uses one method above with `except` / `merge!`.

**trails** (`packages/activerecord/src/reflection.ts#addAggregateReflection`)
stores a JS `Map`, so the single-pair merge is a hand-rolled copy-then-`Map#set`
with an own-property check standing in for the class-attribute read:

    const hasOwn = Object.prototype.hasOwnProperty.call(ar, "_aggregateReflections");
    const existing = (ar as any)._aggregateReflections;
    const aggs = hasOwn && existing instanceof Map ? existing : new Map(...);
    aggs.set(name, reflection);

The container choice is what blocks the call. `_reflections` next door is
already a plain object registered with `classAttribute` (`base.ts:4628`), and
PR #6838 converged `add_reflection` onto activesupport's `except` on the
strength of that.

## Converged shape

- `aggregate_reflections` becomes a plain hash registered through
  `classAttribute` alongside `_reflections`, so reads walk the constructor chain
  and writes are local to the class — Rails' `class_attribute` semantics — and
  the own-property dance disappears.
- `addAggregateReflection` becomes the Rails one-liner: merge the single pair
  onto the read value and reassign.
- Delete the `add_aggregate_reflection -> merge` row from
  `call-mismatches-exclude/activerecord/reflection.json` BY HAND via
  `serializeBaseline`, then
  `pnpm parity:api:calls:tighten activerecord/reflection.json`. No `--write`,
  no reseed.

## Watch out

Every reader of `aggregateReflections` expects a `Map` today
(`.get`/`.has`/iteration). Grep and convert them in the same change;
`reflectOnAllAggregates` / `reflectOnAggregation` are the entry points.

## Acceptance criteria

- [ ] `add_aggregate_reflection` mirrors `reflection.rb:29-31`.
- [ ] `aggregate_reflections` is a `classAttribute`-registered plain hash.
- [ ] The baseline row is deleted and the mark tightened.
- [ ] `pnpm parity:api:calls` / `:args` green; no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
