---
title: "Converge CollectionProxy#create/create! to delegations and drop the hand-rolled through arm"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: 6461
claim: "2026-08-13T13:46:29Z"
assignee: "converge-collection-proxy-create-delegates-to-association"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `CollectionProxy#build` in PR #6411, which made `build` the
Rails delegation to `@association.build` (collection_proxy.rb:315-317).
`createBang`'s through arm did not converge with it and is still a hand-rolled
copy of `CollectionAssociation#_create_record`.

`packages/activerecord/src/associations/collection-proxy.ts` (line numbers as of
f2bfcda4c):

- `createBang` `:3634-3656` — the `_isThrough` arm builds via the proxy-private
  `_buildRecord`, invokes the block itself, fires `beforeAdd`/`afterAdd` by
  hand, saves inside `_throughTransaction`, then infers failure by comparing
  `this._target.length` against a pre-captured `targetBefore` and raises
  `RecordNotSaved("Failed to create join record for through association")` — a
  message Rails does not have.
- `create` `:1401-1420` — the non-through arm re-implements the same
  `transaction { add_to_target(record) { insert_record } }` shape inline.
- `_buildRecord` `:1281-1298` — a proxy-side `build_record` seam Rails has no
  counterpart for: Rails reaches `build_record` only from
  `CollectionAssociation#build` / `#_create_record`, both on the association.

Rails is one body,
`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-372`:

```ruby
def _create_record(attributes, raise = false, &block)
  unless owner.persisted?
    raise ActiveRecord::RecordNotSaved.new("You cannot call create unless the parent is saved", owner)
  end

  if attributes.is_a?(Array)
    attributes.collect { |attr| _create_record(attr, raise, &block) }
  else
    record = build_record(attributes, &block)
    transaction do
      result = nil
      add_to_target(record) do
        result = insert_record(record, true, raise) { @_was_loaded = loaded? }
      end
      raise ActiveRecord::Rollback unless result
    end
    record
  end
end
```

and `CollectionProxy#create` / `#create!` are two-line delegations to
`@association.create` / `create!` (collection_proxy.rb:334-346), which
`Association#create!` routes into `_create_record(attributes, true, &block)`
(association.rb:231-233).

## Converged shape

`CollectionProxy#create` and `#createBang` become the Rails delegations, and the
whole build/transaction/`add_to_target`/`Rollback unless result` body lives once
on `CollectionAssociation#_createRecord` — the through arm reached through
`HasManyThroughAssociation#insert_record`, exactly as Rails reaches it, with no
`targetBefore` length probe and no invented `RecordNotSaved` message. With both
arms gone, `_buildRecord` has no callers and is deleted.

## Deps

Sequenced AFTER `port-collection-association-create-record` (which ports
`_createRecord`) and `route-through-create-via-create-record` (which routes
`_pushThrough`'s `skipCallbacks` arm through it) — this story is the remaining
proxy-side half and should not open before both have landed, since all three
touch the same two files.

## Acceptance criteria

- `CollectionProxy#create` / `#createBang` are delegations to the association's
  `create` / `createBang`.
- The `targetBefore` length probe and the
  "Failed to create join record for through association" message are gone;
  a failed non-raising insert rolls back via `Rollback unless result`.
- `_buildRecord` is deleted.
- has-many, has-many-through, HABTM, nested-attributes and counter-cache suites
  green on all three adapter lanes.
