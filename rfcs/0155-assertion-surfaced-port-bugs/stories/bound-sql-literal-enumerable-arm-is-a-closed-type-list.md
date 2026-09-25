---
title: "bound-sql-literal-enumerable-arm-is-a-closed-type-list"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8058, which inlined `normalizeBoundValue` into
`buildNamedBoundSqlLiteral` and `buildBoundSqlLiteral`
(`packages/activerecord/src/relation/query-methods.ts`). The enumerable arm of
both bodies is still a closed type list:

```ts
} else if (Array.isArray(value) || value instanceof Set) {
```

Rails (`activerecord/lib/active_record/relation/query_methods.rb:1685` and
`:1705`) duck-types it:

```ruby
elsif value.respond_to?(:map) && !value.acts_like?(:string)
```

So a Ruby-Enumerable value other than an Array or a Set (a Range, or an object
that answers `map`) falls into the scalar `else` arm and is bound as-is,
where Rails maps it and binds the list.

This is the same divergence the sibling story
`sanitize-quote-bound-value-enumerable-duck-test` tracks in
`sanitization.ts` `quoteBoundValue` (`sanitization.rb:191-200`). Converge
both through the same `respond_to?(:map)` port so the two bodies agree.

The complication: JS `Set` has no `map`, while Ruby's `Set` does, so a bare
`rbObjRespondTo(value, "map")` would drop the `Set` arm. A plain JS object is
a Ruby Hash, which DOES respond to `map` in Ruby. Settle the trails reading of
"responds to map" (Array, Set, Range, Enumerable-bearing objects) once,
shared with the sibling story.

## Acceptance criteria

- [ ] Both bound-literal bodies test `respond_to?(:map) && !acts_like?(:string)`
      the way the sibling `quoteBoundValue` converges, not a closed type list.
- [ ] A Range bound through `where("id IN (?)", 1..3)` and through the named
      form binds its members, matching Rails.
- [ ] `pnpm parity:api:calls` / `:args` stay green.
