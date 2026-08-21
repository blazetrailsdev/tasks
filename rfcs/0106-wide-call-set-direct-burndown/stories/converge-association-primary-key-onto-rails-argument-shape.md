---
title: "Converge associationPrimaryKeyFor onto Rails' association_primary_key(klass = nil)"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `associationPrimaryKeyFor` is invented surface where Rails has `association_primary_key(klass = nil)`

## Context

`pnpm parity:api:extra --package activerecord` lists `associationPrimaryKeyFor`
as **novel** — a name with no Ruby counterpart — in
`packages/activerecord/src/reflection.ts:1345`. It is the last survivor of the
`*For` family: PR #6825 converged its sibling `joinPrimaryKeyFor` away after the
same finding, so `reflection.ts` went from 6 novel names to 5.

Rails has one method, taking the klass as an optional argument:

- `activerecord/lib/active_record/reflection.rb:583-585`
  — `def association_primary_key(klass = nil); primary_key(klass || self.klass); end`
- `activerecord/lib/active_record/reflection.rb:926-934`
  — `BelongsToReflection`'s override, memoizing `options[:primary_key]`

trails splits each into a zero-arg `get associationPrimaryKey()` plus an
`associationPrimaryKeyFor(klass?)` carrying the real body
(`reflection.ts:1345-1366`, `:1364`).

## Converged shape

Exactly what #6825 did for `joinPrimaryKey`: one
`associationPrimaryKey(klass?: typeof Base)` **method** per reflection class with
Rails' body and Rails' default, the `*For` sibling deleted, and every property
read updated to a call.

Two warnings from doing the `joinPrimaryKey` one:

- Several readers are duck-typed (`as any`, structural `{ associationPrimaryKey:
string | string[] }` shapes), so `tsc` will NOT catch every site — a missed one
  yields a function object where a column name is expected and only surfaces at
  runtime. Grep for `.associationPrimaryKey` across `packages/*/src` and fix the
  `as any` sites by hand.
- Hand-built reflection stubs in tests carry the property form
  (`associationPrimaryKey: "id"`) and must become `() => "id"`.

## Acceptance criteria

- [ ] One `associationPrimaryKey(klass?)` method per class, Rails' name, shape
      and default; `associationPrimaryKeyFor` deleted.
- [ ] `parity:api:extra --package activerecord` drops `associationPrimaryKeyFor`
      from `reflection.ts`'s novel list.
- [ ] `parity:api:calls` / `:args` green with no new rows; associations,
      predicate-builder, fixtures, reflection and core suites pass.
