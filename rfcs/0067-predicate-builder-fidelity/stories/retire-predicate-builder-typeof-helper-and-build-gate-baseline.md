---
title: "Retire PredicateBuilder#typeOf helper; inline table.type reads and delete build -> table/type wide-gate baseline entries"
status: ready
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to PR #5103, which inlined `table.type(columnName)` in
`buildBindAttribute` and deleted its two wide-gate baseline entries. The
private `typeOf` helper (`packages/activerecord/src/relation/predicate-builder.ts:94-96`)
still exists with three callers — the RangeHandler closure (~line 55),
`castValue` (~line 371), and `forceEquality` detection (~line 546, the `build`
path). Rails has no such helper: `build` reads
`table.type(attribute.name).force_equality?(value)` inline
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:57-60`).

Because the reads hide inside the helper, the name-based wide gate cannot see
them, and `call-mismatches-wide-exclude/activerecord/relation/predicate-builder.json`
still baselines `build -> table` and `build -> type` (RFC 0047 seed entries).
Same stale-baseline failure mode #5103's story existed to prevent: a future
change dropping the read would go unflagged.

## Acceptance criteria

- [ ] `typeOf` is deleted; each caller reads `this.table.type(...)` inline like
      Rails (or is justified at the call site if the shape genuinely differs).
- [ ] The `build -> table` and `build -> type` baseline entries are deleted and
      `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` passes
      with them gone (re-extract first, not re-baseline).
- [ ] predicate-builder tests (`.test.ts` + `.trails.test.ts`) pass unchanged.
