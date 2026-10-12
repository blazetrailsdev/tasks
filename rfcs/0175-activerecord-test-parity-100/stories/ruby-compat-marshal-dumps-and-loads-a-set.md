---
title: "ruby-compat: Marshal dumps and loads a Set (unblocks the has-many-through marshal dump test)"
status: ready
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-record-round-trips-marshal-6-1-format`. Under
`ActiveRecord::Marshalling.format_version` 6.1 a record's dump reaches each
cached association through `Association#marshal_dump`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:206-209`),
which writes every instance variable but `@reflection` / `@through_reflection`.
A collection association holds
`@replaced_or_added_targets = Set.new.compare_by_identity`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb`,
`reset`), which Ruby 3.3 dumps as a `T_OBJECT` named `Set` with one ivar,
`@hash`, a `compare_by_identity` Hash with a `false` default.

In trails the member is a JS `Set`
(`packages/activerecord/src/associations/collection-association.ts`,
`_replacedOrAddedTargets = new Set<Base>()`, pathed `@replaced_or_added_targets`
by `rbDeclareIvar`), and `Marshal.dump` refuses it: `wObject`
(`packages/ruby-compat/src/marshal.ts`) has no arm for a `Set`, so it takes the
`T_DATA` arm and raises `no _dump_data is defined for class Set`. ruby-compat's
own `Set` (`packages/ruby-compat/src/set.ts`) extends the JS `Set` and keeps its
members in a `#hash` private, so it is refused the same way, it has no
`compareByIdentity`, and `Set` is not seated in the path table
(`rbPathToClass("Set")`).

After the split PR this is the only thing the dump of a record with a
preloaded collection association still refuses: `Marshal.dump(await
Post.includes(":firstBlueTags").first())` fails on
`@_association_cache{firstTaggings}.@replaced_or_added_targets` alone.

## Acceptance criteria

- [ ] `Marshal.load(Marshal.dump(set))` answers an equal Set, for a plain Set
      and a `compare_by_identity` one, writing the bytes MRI 3.3 writes
      (`o:\bSet\x06:\n@hash}…`), covered in
      `packages/ruby-compat/src/marshal.trails.test.ts` against
      `marshal.fixtures.rb`.
- [ ] `CollectionAssociation`'s `@replaced_or_added_targets` is the
      `compare_by_identity` Set Rails builds.
- [ ] "marshal dump"
      (`associations/has_many_through_associations_test.rb:63-66`,
      `packages/activerecord/src/associations/has-many-through-associations.test.ts`)
      is live with Rails' body and its `BLOCKED:` line names no story.
