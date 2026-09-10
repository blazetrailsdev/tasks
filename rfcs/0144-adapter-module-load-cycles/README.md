---
rfc: "0144-adapter-module-load-cycles"
title: "Break the module-load cycles that keep mixin wiring out of module scope"
status: closed
created: 2026-09-10
updated: 2026-09-10
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
priority: 2
---

# RFC 0144 — Break the module-load cycles that keep mixin wiring out of module scope

## Summary

Two RFC 0119 stories are two halves of one problem: `AbstractAdapter` cannot
perform its `include(AbstractAdapter, SchemaStatements)` at module-eval time —
where Rails performs it and where every other trails mixin lives — because the
adapter tree sits inside an import cycle. One story measured the cycle; the
other measured the fix and found a second cycle behind it. Neither can close
alone.

## Motivation

### The cycle, measured

`abstract-adapter-mixin-wiring-restore-module-eval` established that PR #5775's
`base.ts` removal did not clear it. The residual is:

```text
abstract/schema-statements.ts -> migration/join-table.ts -> model-schema.ts
  -> connection-handling.ts -> connection-adapters.ts -> abstract-adapter.ts
```

Entered through `SchemaStatements`, the module-eval-time
`include(AbstractAdapter, SchemaStatements)` reads `AbstractAdapter` in TDZ —
verified directly (`Object.keys(undefined)` inside `include()`). The
`join-table -> model-schema` edge is **Rails' own**
(`migration/join_table.rb:11-13`), so it is not a trails invention to delete.

### The fix works, and lands on a second cycle

> **Superseded 2026-09-10** (story `remeasure-join-table-cut-against-current-main`,
> trails main 13ca39d0b). PR 7061 retired the `associations.ts:6` force-load, and
> the AR suite no longer fails at collection time with the cut applied. The one
> surviving leg is
> `schema-statements -> migration/command-recorder.ts:4 -> migration.ts:47 (DEFAULT_ENV) -> connection-handling -> connection-adapters -> abstract-adapter`,
> which Rails also resolves at call time (`migration.rb:676,773,1341`). See
> `break-schema-statements-join-table-cycle-blocking-module-eval-includes` for
> the measurement. The text below records the 2026-08-25 measurement.

`break-schema-statements-join-table-cycle-blocking-module-eval-includes`
measured the zero-import slot: it **does** break the cycle (`scripts/test-deps/`
green with the mixin block back at module scope) and then reds the entire AR
suite at collection time — `Class extends value undefined` at
`associations/collection-proxy.ts`.

The reason is that the edge is also an accidental load-order guarantee: the
vitest setup preload entered `associations.ts` early through
`join-table -> model-schema -> associations`, so `associations.ts` was always
fully evaluated before `relation.ts`. Cut it and

```text
relation.ts -> insert-all.ts -> model-schema.ts -> associations.ts
  -> (associations.ts:6, a bare side-effect import of collection-proxy.js)
  -> relation.ts
```

crashes with `Relation` still in TDZ.

There is no third route: every path from `schema-statements.ts` to
`abstract-adapter.ts` runs through `model-schema.ts`, which reaches
`abstract-adapter.ts` by several independent legs. Cutting
`model-schema -> connection-handling` with a slot was tried and measured, and
`adapter-graph-import-tdz.test.ts` still fails via
`model-schema -> associations -> persistence -> connection-handling`.

### The actual blocker is in associations, not in the adapter

`associations.ts:6` eagerly force-loads `collection-proxy.ts` for its
side-effect, even though the constructor is already published through
`associations/collection-proxy-slot.ts`. Until that force-load is gone,
`relation.ts` and `associations.ts` stay load-order dependent and every adapter
cycle fix reds at collection time. That is work on the relation↔associations
cycle, and it is what this RFC has to do first.

## Design

Strictly ordered, because each step is only measurable once the previous lands.

1. **Retire the eager force-loads in `associations.ts`.** The slot module already
   publishes the constructor; the bare side-effect import is the load-order
   dependency. Verified the way CLAUDE.md requires — a plain-node import of the
   **built** `dist/**.js` modules as entry modules, not a vitest run, which
   enters the funnel module first and masks the TDZ.
2. **Cut `migration/join-table.ts -> model-schema.ts`** with a zero-import slot,
   per the sanctioned shape.
3. **Restore `include(AbstractAdapter, SchemaStatements)` to module scope** and
   delete the deferred-wiring workaround.

## Non-goals

- **Rewriting the `model-schema.ts` hub.** Several independent legs reach
  `abstract-adapter.ts` through it; this RFC cuts one measured edge, it does not
  redesign the graph.
- **Deferring the subclass edges with a slot per `extends` site.** Already
  ratified as the alternative that looks smaller and does not work — nothing
  then loads the subclass modules, so their self-registration never runs.

## Alternatives considered

- **A slot on `model-schema -> connection-handling` instead.** Tried and
  measured; `adapter-graph-import-tdz.test.ts` still fails via
  `model-schema -> associations -> persistence -> connection-handling`.
- **Leaving the wiring deferred permanently.** Rejected: it is a deviation from
  Rails' module-eval `include` in the one package where mixin wiring is most
  load-bearing, and the deferral is what the two stories exist to remove.

## Rollout

1. Phase 1 — `associations.ts` eager force-load retirement (done in PR 7061;
   re-measured by `remeasure-join-table-cut-against-current-main`).
2. Phase 2 — `break-schema-statements-join-table-cycle-blocking-module-eval-includes`.
3. Phase 3 — `abstract-adapter-mixin-wiring-restore-module-eval`.

## Verification

RFC 0119's blocked count drops by 2. `include(AbstractAdapter, SchemaStatements)`
sits at module scope, `scripts/test-deps/` and
`adapter-graph-import-tdz.test.ts` are green, and a plain-node import of the
built `dist` modules — entered at each participant in turn — throws no TDZ error.

## Open questions

1. **Does Phase 1 need its own slot, or just deletion of the side-effect
   import?** The constructor is already published through the slot, so deletion
   is expected to suffice; Phase 1 measures it.

## Changelog

- 2026-09-10: initial RFC
