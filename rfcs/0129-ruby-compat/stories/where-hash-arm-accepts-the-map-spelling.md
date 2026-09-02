---
title: "where-hash-arm-accepts-the-map-spelling"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 73
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`build_where_clause`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`, the
`case opts ... when Hash` arm) matches ANY Ruby `Hash`, so
`Model.where(hash_with_indifferent_access)` and `where(params.to_h)` work in
Rails — `HashWithIndifferentAccess < Hash`
(`activesupport/lib/active_support/hash_with_indifferent_access.rb:53`).

trails' port (`packages/activerecord/src/relation/query-methods.ts`,
`buildWhereClause`) spells that arm `isPlainObject(opts)`, so only the plain
object spelling of a Ruby Hash is accepted. The other two spellings the repo
uses for a Hash — a `Map`, and (since PR #7345) a
`HashWithIndifferentAccess`/`Rack::Headers`, both of which now subclass
ruby-compat's `Hash extends Map` — fall to the `else` and raise
`ArgumentError: Unsupported argument type: [object Map] (object)`.

Confirmed on the merged branch:
`Topic.where(new HashWithIndifferentAccess({ id: 1 }))` raises, where
`Topic.where({ id: 1 })` succeeds. `order()` does NOT have this gap — its
argument walk already carries `instanceof Map` branches
(`flattenedArgs`/`columnReferences`/`preprocessOrderArgs`), pinned by
`packages/activerecord/src/relation/hwia-order-args.trails.test.ts`.

The same gap exists in the `OrderArg`-style TS signatures wherever a parameter
is typed `Record<string, …>` alone for what Ruby types as a Hash.

## Converged shape

`buildWhereClause`'s Hash arm accepts the `Map` spelling alongside the plain
object — one `when Hash` in Ruby is one branch here, reading keys and values
through the same `transform_keys`/`PredicateBuilder.references` path either way,
not a second copied branch. `where`'s parameter type admits `Map<string, …>` the
way `OrderArg` (`query-methods.ts:206-213`) already does.

## Acceptance criteria

- `Model.where(new HashWithIndifferentAccess({ id: 1 }))` and
  `Model.where(new Map([["id", 1]]))` build the same where clause as
  `Model.where({ id: 1 })`, pinned by a trails-only test that fails on the
  baseline with the `Unsupported argument type` ArgumentError.
- The attribute-alias `transform_keys` and `references` steps run for the Map
  spelling too — not a branch that skips them.
- No new baseline row; `pnpm parity:api:calls` and `:args` unchanged.
