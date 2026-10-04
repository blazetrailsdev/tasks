---
title: "activerecord: isAssociationCached takes the record as an argument, so marshal_dump throws on a model with associations"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8472. Rails' `association_cached?` is an instance method taking the name
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations.rb:65-67`):

    def association_cached?(name) # :nodoc:
      @association_cache.key?(name)
    end

trails' `isAssociationCached` (`packages/activerecord/src/associations.ts:350`) is
`(record: Base, name: string)`, and `base.ts` (the `include` block near `:2796`) installs that
two-argument function as the instance method. `_marshalDump71`
(`packages/activerecord/src/marshalling.ts:57`) calls it the Rails way,
`this.isAssociationCached(reflection.name)`, so the name lands in `record` and the body reads
`"<name>"._associationCache.has(undefined)`.

Observed: on a model with at least one association, `record._marshalDump71()` throws
`TypeError: Cannot read properties of undefined (reading 'has')` at `associations.ts:351`
(seen with `Comment` while writing `select-alias-reader.trails.test.ts`, which works around it by
building the Marshal state by hand).

## Converged shape

`isAssociationCached` is a `this`-typed function taking `name` only, as `associations.rb:65-67`,
and every caller passes the name alone.

## Acceptance criteria

- [ ] `isAssociationCached(this: Base, name)` matches `associations.rb:65-67`; no caller passes the record.
- [ ] `_marshalDump71()` on a loaded record of a model with associations returns its payload, covered by a test that fails today.
- [ ] The `marshal_load` test in `select-alias-reader.trails.test.ts` dumps through `_marshalDump71()` instead of a hand-built state.
