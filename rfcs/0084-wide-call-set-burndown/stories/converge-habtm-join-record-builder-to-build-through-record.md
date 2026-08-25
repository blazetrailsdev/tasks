---
title: "converge-habtm-join-record-builder-to-build-through-record"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6410
claim: "2026-08-12T12:46:03Z"
assignee: "activesupport-closure-skip-groups-triage"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `CollectionAssociation#build` in PR #6394 (RFC 0084).

`buildHabtmThroughRecord` (`packages/activerecord/src/associations/has-many-through-association.ts:640-701`)
is a trails-invented join-attribute builder with no Rails counterpart: it
hand-derives `ownerFk` / `sourceFk` from the JoinModel's `_associations`, reads
the owner PK, and hands the resulting `joinAttrs` to
`throughProxy.build(joinAttrs)`.

Rails has no such builder. `HasManyThroughAssociation#build_through_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:55-66`)
is:

```ruby
def build_through_record(record)
  @through_records[record] ||= begin
    ensure_mutable
    attributes = through_scope_attributes
    attributes[source_reflection.name] = record
    through_association.build(attributes)
  end
end
```

— the join row's attributes come from `through_scope_attributes` (`:71-80`),
which explicitly `except!`s the through reflection's foreign key, and the
**association object** is assigned under `source_reflection.name`, never a
hand-computed FK column. The owner FK is then written at insert time by
`HasManyAssociation#insert_record` (`has_many_association.rb:61-64`).

PR #6394 had to add an explicit `throughProxy.setOwnerAttributes?.(joinRecord)`
after the build to keep HABTM working, because the trails builder computes the
FK at BUILD time and `initialize_attributes` (`association.rb:219-222`,
`assigned_keys - skip_assign`) re-admits the FK so `scope_for_create`'s value —
null on the new-owner path — wins over the caller's. Measured: with
`joinAttrs = {developer_id: 12}` the built record still reads
`developer_id = null`. That extra call is the symptom; the builder is the cause.

Also note `buildThroughRecord`'s HABTM branch bypasses `throughRecordsCache`,
where Rails memoizes on `@through_records[record] ||=` — so the row is built
twice (once in `concatRecords`, once in `saveThroughRecord`).

## Acceptance criteria

- [ ] Converge `buildHabtmThroughRecord` to Rails' `build_through_record`:
      attributes from `through_scope_attributes` (with the through FK excepted),
      the source record assigned under `source_reflection.name`, no
      hand-derived `ownerFk`/`sourceFk` columns.
- [ ] Memoize through `@through_records` (`throughRecordsCache`) as Rails does,
      so HABTM stops building the join row twice.
- [ ] The owner FK reaches the row via `insert_record` →
      `set_owner_attributes` (`has_many_association.rb:61-64`), letting the
      explicit `setOwnerAttributes` call added in PR #6394 be deleted.
- [ ] `associations/habtm-join-owner-fk-new-owner.trails.test.ts` and the
      `HasAndBelongsToManyAssociationsTest` suite stay green on all three
      adapter lanes.
