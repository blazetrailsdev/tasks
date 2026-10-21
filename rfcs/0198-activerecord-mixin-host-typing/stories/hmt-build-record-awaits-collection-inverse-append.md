---
title: "hmt-build-record-awaits-collection-inverse-append"
status: closed
updated: 2026-10-21
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: trails#9157 (merged) reverted the 'void reader.push' arm to addToTarget (origin/main has-many-through-association.ts:155). The remaining async-build convergence for both collection and has_one arms is tracked by the blocked story has-many-through-collection-inverse-sends-reader-append (owner decision on async CollectionProxy#build)."
---

## Context

Rails `HasManyThroughAssociation#build_record`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:93-111`)
appends the through record to a collection inverse with
`record.send(inverse.name) << build_through_record(record)` (line 102). That runs
`CollectionProxy#<<` → `proxy_association.concat(records)`
(`collection_proxy.rb:1049-1051`) to completion before the method returns and
before its `ensure` clears `@through_scope`.

trails (`packages/activerecord/src/associations/has-many-through-association.ts`,
`buildRecord`'s `inverse.isCollection()` arm, after trails#9151) calls
`reader.push(...)` and discards the result with `void`. `CollectionProxy#push`
(`collection-proxy.ts`) now throws synchronous `concat` failures before it returns.
`concat` is still async in two cases: an async `before_add` callback, and
`loadTarget` on a newly built owner that has an assigned primary key. In both,
`buildRecord` returns and clears `_throughScope` before the append finishes,
and a failure is an unhandled rejection. The has_one arm (`writer`, trails#9142)
has the same shape.

## Acceptance criteria

- [ ] The collection-inverse append in `buildRecord` finishes before `buildRecord` returns and before its `finally`, as Rails' `<<` does (for example, `concat`'s new-record path never goes async for a built owner, or the build path that calls `buildRecord` awaits the append). Remove the `void`.
- [ ] A failing append surfaces to the caller of `build`. It is not an unhandled rejection.
- [ ] `has_many_through_associations_test.rb` build tests stay green on all adapters.
