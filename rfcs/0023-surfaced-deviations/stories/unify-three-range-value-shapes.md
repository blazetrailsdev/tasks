---
title: "unify-three-range-value-shapes"
status: draft
updated: 2026-08-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: ["0000-corelib-primitives"]
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Trails carries **three independent, mutually incompatible `Range` value shapes**:

1. `packages/activesupport/src/range-ext.ts:14-26` — `interface Range<T>` with
   `begin` / `end` / `excludeEnd`, the shape Rails' `core_ext/range/*` ports and
   `activemodel/src/validations/clusivity.ts:218` consume.
2. `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:26-31` —
   a `class Range` with the same three fields plus PG-specific
   `rangeBoundLiteral` rendering (`oid/range.ts:41`).
3. `packages/activerecord/src/attribute-methods/time-zone-conversion.ts:375-382` —
   a structural `RangeLike` interface plus an `isRangeLike` duck-type check
   (`"begin" in v && "end" in v && "excludeEnd" in v`) and a
   `constructor`-based reconstruction at `time-zone-conversion.ts:386-391`.

Ruby has one `Range`. The triplication exists because none of the three is
authoritative — and none _can_ be today, because the base shape
(`range-ext.ts`) is unanchored Ruby core with no Rails or gem counterpart to
compare against (tagged `@noRailsEquivalent PERMANENT`, `range-ext.ts:19-22`).

**Blocked on `move-range-core-and-succ-to-corelib`** (RFC
`0000-corelib-primitives`), which moves the base `Range` into `packages/corelib`
anchored to `ruby/spec`'s `core/range/*`. Once there is one authoritative,
measurable `Range`, the PG and time-zone shapes can converge onto it. Attempting
this before that lands would just pick one of three unanchored shapes arbitrarily.

Surfaced by the corelib audit; filed so the `file:line` set is not re-derived.

## Acceptance criteria

- [ ] `oid/range.ts`'s `Range` class and `time-zone-conversion.ts`'s `RangeLike`
      both express the `corelib` `Range` shape rather than redeclaring it.
- [ ] The `isRangeLike` duck-type check (`time-zone-conversion.ts:382`) either
      goes away or is justified at the call site — Rails does not duck-type
      `Range` there.
- [ ] PG-specific rendering (`rangeBoundLiteral`, the `[`/`)` bracket logic at
      `oid/range.ts:41,72`) stays in the PG adapter — this story unifies the
      _value shape_, not the adapter behavior.
- [ ] `packages/activerecord/src/adapters/postgresql/pg-range.ts:31,55,72`
      updated consistently.
- [ ] PG range tests pass on the pg lane; no change to emitted SQL.
