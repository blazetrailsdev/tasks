---
title: "expand-from-hash-drops-the-general-array-key-arm"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PredicateBuilder#expand_from_hash` opens with two arms trails never ported
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:87-97`):

```ruby
if key.is_a?(Array) && key.size == 1
  key = key.first
  value = value.flatten
end

if key.is_a?(Array)
  queries = Array(value).map do |ids_set|
    raise ArgumentError, "Expected corresponding value for #{key} to be an Array" unless ids_set.is_a?(Array)
    expand_from_hash(key.zip(ids_set).to_h)
  end
  grouping_queries(queries)
elsif ...
```

That is the general array-key branch: it is what makes
`where(klass.primary_key => id_tuples)` work for a **plain** composite primary
key, with no association involved. `packages/activerecord/src/relation/predicate-builder.ts`'s
`expandFromHash` (`:47-70`) has no such arm — its first branch is the nested-hash
one. The zip-and-group shape IS ported, but only inside
`buildFromHashAssociation`'s through-association path (`:130-151`), against
`associatedTable.primaryKey`, and `groupingQueries` (`:169`) already exists, so
the missing arm is the general (non-association) entry point, not the machinery
underneath it.

The gap has a caller today. `assignNestedAttributesForCollectionAssociation`
(`packages/activerecord/src/nested-attributes.ts`) mirrors
`nested_attributes.rb:514`:

```ruby
association.scope.where(association.klass.primary_key => attribute_ids)
```

Ruby's hash key there is an Array when the target model has a composite primary
key, and `expand_from_hash`'s array-key arm handles it. In TS that one call had
to become an OR-of-per-id-`where`s reduced with `.or()`, carrying a
`@missingRailsArgs where — CONVERGEABLE <this story>` receipt at the call site,
because the single `where({ [pk]: ids })` call trails can spell cannot express a
composite key at all — a JS object key stringifies an array.

## Converged shape

Port the two arms into `expandFromHash` so a composite key round-trips through
one `where` call, then delete the manual `.or()` reduce in `nested-attributes.ts`
and its receipt, restoring the single Rails-shaped call for both scalar and
composite primary keys.

The open design question is how the caller spells an Array key, since a JS object
key cannot be one. Options, in the order they should be tried: a `Map` argument
to `where`, which `expandFromHash` already iterates as entries; or the joined
`"a,b"` spelling `Relation#find` already accepts for a composite id. Whichever is
chosen, the arm inside `expandFromHash` is the Ruby one line for line, including
the `key.size == 1` flatten and the `ArgumentError` with Rails' message
("Expected corresponding value for #{key} to be an Array"), which
`buildFromHashAssociation:139-143` already raises verbatim on its own path.

## Acceptance criteria

- [ ] `expandFromHash` carries the `key.is_a?(Array) && key.size == 1` flatten
      arm and the `key.is_a?(Array)` grouping arm, in Rails' order, ahead of the
      nested-hash arm, reusing the existing `groupingQueries`.
- [ ] The `ArgumentError` matches Rails' message and raise site.
- [ ] A composite-pk `where` over a set of id tuples emits the same OR-of-ANDs
      SQL the through-association path already emits, covered by a test.
- [ ] `nested-attributes.ts` is back to a single
      `scope.where({ [primaryKey]: attributeIds })` and its
      `@missingRailsArgs where` receipt is deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` non-regressing.
