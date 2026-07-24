---
title: "buildRangePredicate is trails-only and duplicates build's force-equality precedence"
status: done
updated: 2026-07-24
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5200
claim: "2026-07-24T01:12:10Z"
assignee: "buildrangepredicate-duplicates-build-force-equality-precedence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while inlining `typeOf` in #5193. `PredicateBuilder#buildRangePredicate`
(`packages/activerecord/src/relation/predicate-builder.ts:380-386`) is a
trails-only method with no Rails counterpart: Rails has no `build_range_predicate`
in `vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb`.
A PG range value reaches `build` (predicate_builder.rb:57-69), whose
force-equality check routes it to `attribute.eq(build_bind_attribute(...))`, and
otherwise falls through to `handler_for` → `RangeHandler`.

Because `buildRangePredicate` bypasses `build`, it has to re-state `build`'s
force-equality precedence inline — #5193 duplicated the
`table.type(name).isForceEquality?(v)` check into it rather than let the
divergence widen silently. Two copies of one precedence rule is exactly the
drift hazard the RFC 0067 cluster exists to remove: a future change to `build`'s
ordering (e.g. the nil/normalize branches above it) will not be mirrored here.

Find the callers of `buildRangePredicate` and route them through `build` so the
precedence lives in one place, or justify at the call site why the range path
genuinely cannot enter `build`.

## Acceptance criteria

- [ ] `buildRangePredicate` is deleted, or its body delegates to `build` so the
      force-equality check exists once.
- [ ] Callers updated; `predicate-builder.test.ts` + `.trails.test.ts` and
      `connection-adapters/postgresql/oid/range.test.ts` pass unchanged.
- [ ] `pnpm api:calls:wide` still passes with no new baseline entries.
