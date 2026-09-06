---
title: "isSameHash's identity guard cannot read a Map attributes hash"
status: in-progress
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: 7571
claim: "2026-09-06T18:18:16Z"
assignee: "schema-dumpers-take-columns-not-columninfo"
blocked-by: null
closed-reason: null
---

## Context

Rails' association arm of `expand_from_hash` guards its recursion with an
identity check against the WHOLE attributes hash
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:118-122`):

```ruby
queries = klass.new(associated_table, value).queries.map! do |query|
  query == attributes ? self[key, value] : expand_from_hash(query)
end
```

`Hash#==` compares keys and values, so the guard answers for any hash shape.

trails ports it as `isSameHash(query, attributes)`
(`packages/activerecord/src/relation/predicate-builder.ts:172`, helper at
`:419-427`), which reads its arguments with `Object.keys` / `k in b`. Since
`where-hash-arm-resolves-array-key-aliases` (#7479) an attributes hash carrying
an Array key is a `Map` — the composite-key spelling
`where([:shop_id, :id] => tuples)` cannot be a JS object — and `expandFromHash`
hands that `Map` to `buildFromHashAssociation` through an
`attributes as Record<string, unknown>` cast (`:79`). `Object.keys(map)` is
`[]`, so the guard answers `false` for every `query`, and a self-referential
association query recurses into `expandFromHash` where Rails would have stopped
at `self[key, value]` — the "stack level too deep" case the Rails comment at
`predicate_builder.rb:119-120` names.

Reachable whenever one `where` hash mixes an Array key with an association key.

## Converged shape

`isSameHash` reads both spellings of a Ruby Hash (the plain object and the
`Map`), the way `entriesOf` (`predicate-builder.ts:383-388`) already does for
every other read in the file, and `buildFromHashAssociation` takes `Attributes`
rather than a cast `Record<string, unknown>`. Array keys compare by value, since
Ruby's `Hash#==` does.

## Acceptance criteria

- [ ] `buildFromHashAssociation`'s `attributes` parameter is typed `Attributes`
      and the `as Record<string, unknown>` cast at `expandFromHash` is deleted.
- [ ] `isSameHash` compares a `Map` receiver by entries, including an Array key
      by value, matching Ruby `Hash#==`.
- [ ] A test pins the guard: a `where` hash mixing an Array key with a
      self-referential association key stops at `self[key, value]` rather than
      recursing.
- [ ] `pnpm parity:api:calls` and `:args` unchanged or improved.
