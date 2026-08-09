---
title: "unify-three-range-value-shapes"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Internal refactor onto an admittedly unanchored target (range-ext.ts is @noRailsEquivalent PERMANENT); does not converge behaviour toward Rails. Revisit only if 0000-corelib-primitives is reactivated."
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

**Sequencing.** RFC `0000-corelib-primitives` would have moved the base `Range`
into `packages/corelib` anchored to `ruby/spec`'s `core/range/*`, giving one
authoritative, measurable shape for the other two to converge onto. That RFC is
**postponed**, so this story is no longer gated on it — but the underlying
difficulty stands: with `range-ext.ts` still unanchored, unifying now means
picking one of three unmeasured shapes on judgement rather than against a spec.

Two viable readings, and the claiming agent should pick deliberately rather than
drift into one: (a) converge `oid/range.ts` and `RangeLike` onto `range-ext.ts`'s
triple now, accepting that the target is unanchored, and treat re-anchoring as
later work; or (b) leave it and reactivate `0000-corelib-primitives` first. (a)
is defensible — three divergent shapes is worse than one unanchored shape — but
it is a call, not a default.

Surfaced by the RFC 0088 audit; filed so the `file:line` set is not re-derived.

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
