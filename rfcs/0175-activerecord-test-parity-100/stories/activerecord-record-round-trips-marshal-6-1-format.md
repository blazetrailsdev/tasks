---
title: "activerecord: a record round-trips Marshal under format 6.1 (5 parked cases)"
status: done
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - ruby-compat-marshal-dumps-and-loads-a-set
  - activerecord-relation-round-trips-marshal
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8834
claim: "2026-10-12T20:03:49Z"
assignee: "activerecord-record-round-trips-marshal-6-1-format"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activerecord-port-marshal-excluded-tests`. Under the default
`ActiveRecord::Marshalling.format_version` of 6.1 a record has no
`marshal_dump` (`vendor/rails/v8.0.2/activerecord/lib/active_record/marshalling.rb:11-13`),
so `Marshal.dump(record)` writes every instance variable of the record and of
everything it reaches. In trails that dump raises, so these five Rails cases
are parked as `it.skip` under `BLOCKED: activerecord-record-round-trips-marshal-6-1-format`:

- `marshal_serialization_test.rb:60-70` "rails 6 1 rountrip"
  (`packages/activerecord/src/marshal-serialization.test.ts`)
- `associations/extension_test.rb:46-65` "marshalling extensions" and
  "marshalling named extensions"
- `associations/has_many_through_associations_test.rb:63-66` "marshal dump"
- `associations/has_one_associations_test.rb:79-89` "can marshal has one
  association with nil target"

The 7.1 format already round-trips ("rails 7 1 rountrip" is live), because
`_marshal_dump_7_1` writes only `attributes_for_database`, `new_record?` and the
cached association targets.

What the 6.1 dump of `Topic.find(1)` reaches today, measured by dumping each
instance variable on its own:

- `@_context_for_validation`: `ActiveModel::ValidationContext`
  (`activemodel/lib/active_model/validations.rb:503`) is not seated, so
  `class2path` raises `undefined class/module ValidationContext`.
- `@_attributes`: `ActiveRecord::Result::IndexedRow`
  (`activerecord/lib/active_record/result.rb:39`) and
  `ActiveModel::AttributeMutationTracker` are not seated, and `@types` holds an
  anonymous class (`can't dump anonymous module`).
- `@_association_cache`: the six concrete association classes are assigned to
  the namespace with `Associations.HasManyAssociation = HasManyAssociation`
  (`packages/activerecord/src/associations/has-many-association.ts:279` and its
  five siblings) where `rbModConstSet` would path them. Past that,
  `Association#marshal_dump`
  (`activerecord/lib/active_record/associations/association.rb:206-209`) dumps
  every instance variable but `@reflection` / `@through_reflection`, and a
  trails association carries members Rails' has not: `@_cached_scope` (a
  `Relation` whose predicate builder holds a `Set`, a `Map` and a `WeakMap`),
  `@callback` and `@callbacks_for` (functions), `@_proxy`,
  `@_replaced_or_added_targets` (a `Set`) and `@_target_store`.
- The record's own instance variable names differ from Rails' (`@_attributes`
  for `@attributes`, `@_new_record` for `@new_record`), which matters only for
  a dump Rails wrote; see `activerecord-load-rails-written-marshal-fixtures`.

`debug-of-a-record-takes-the-inspect-arm-because-marshal-refuses-it` (RFC 0176)
asks for the dump half of the same thing for `Company.new`.

## Acceptance criteria

- [ ] `Marshal.load(Marshal.dump(record))` answers an equal record under format
      6.1, for a new record, a loaded one, and one with a loaded has-many,
      has-many-through and has-one (nil target) association.
- [ ] Every class the dump reaches is seated under its Ruby path with
      `rbModConstSet`, and every association member with no Rails counterpart
      is either converged away or kept out of the dump the way Rails keeps
      `@reflection` out.
- [ ] The five cases above are live with Rails' bodies and their `BLOCKED:`
      lines are gone.

## Verification

```bash
pnpm vitest run packages/activerecord/src/marshal-serialization.test.ts packages/activerecord/src/associations/extension.test.ts packages/activerecord/src/associations/has-one-associations.test.ts packages/activerecord/src/associations/has-many-through-associations.test.ts
```
