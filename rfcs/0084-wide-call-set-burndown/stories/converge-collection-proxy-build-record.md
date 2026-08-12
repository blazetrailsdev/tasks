---
title: "converge CollectionProxy#_build construction onto Association#build_record"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6388
claim: "2026-08-11T23:46:06Z"
assignee: "converge-collection-proxy-build-record"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing #6383 (`converge-collection-proxy-apply-scope-for-create`).

`CollectionProxy#_build` and `#_buildThrough`
(`packages/activerecord/src/associations/collection-proxy.ts:1300-1400`) still
hand-roll the record construction that Rails does in
`Association#build_record` (vendor/rails/activerecord/lib/active_record/associations/association.rb:383-388):

```ruby
def build_record(attributes)
  reflection.build_association(attributes) do |record|
    initialize_attributes(record, attributes)
    yield(record) if block_given?
  end
end
```

Rails resolves the target class inside
`AssociationReflection#build_association` → `klass.new(attributes, &block)`,
where STI subclass resolution falls out of `Base.new`'s inheritance-column
handling (`vendor/rails/activerecord/lib/active_record/inheritance.rb`
`new` / `subclass_from_attributes`). The proxy instead peeks at
`scope_for_create` through the invented private `_scopeForCreateRaw()`
(`collection-proxy.ts:1394`) and calls `findStiClass` itself at two sites
before instantiating, and builds the foreign-key/polymorphic-type attribute
hash inline rather than letting `initializeAttributes` anchor them.

PR #6383 converged the `scope_for_create.except!` half — both sites now call
`Association#initializeAttributes` — but the construction half remains.

## Acceptance criteria

1. `CollectionProxy#_build` / `#_buildThrough` route construction through the
   association's `buildRecord` (`Association#build_record`,
   association.rb:383) so `reflection.buildAssociation(attributes)` does the
   instantiation and STI resolution, as Rails does.
2. `_scopeForCreateRaw` (`collection-proxy.ts:1394`) is deleted — its only
   remaining callers are the two STI peeks this story removes. It has no Rails
   counterpart.
3. has_many / has_many :through build + create tests stay green, including the
   STI-from-scope cases in
   `packages/activerecord/src/associations/has-many-associations.test.ts`.
