---
title: "Port the Array arm of CollectionAssociation#_create_record and HasManyAssociation#_create_record"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6424
claim: "2026-08-12T16:16:54Z"
assignee: "naming-burndown-2-ar-abstract-adapters-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-372`)
recurses over an Array of attribute hashes:

```ruby
if attributes.is_a?(Array)
  attributes.collect { |attr| _create_record(attr, raise, &block) }
else
  ...
end
```

and `HasManyAssociation#_create_record` (has_many_association.rb:143-149)
branches on the same test so the Array arm delegates to `super` WITHOUT the
per-element counter bump (each recursion bumps it once instead).

trails has neither arm. `_createRecord`
(`packages/activerecord/src/associations/collection-association.ts`, ported in
PR #6410) takes a single attribute hash, and the multi-record form is a loop in
`CollectionProxy#create` / `createBang`
(`packages/activerecord/src/associations/collection-proxy.ts`) that calls the
association once per element. The JSDoc on both `_createRecord` overrides
records this, so the behaviour is right today — but the decomposition is not
Rails', and the Array shape is unreachable from the OO surface
(`association.create([{...}, {...}])` does not work the way Rails' does).

## Converged shape

Widen `Association#_createRecord` / `CollectionAssociation#_createRecord` to
Rails' signature — `attributes` accepting an Array — and port both Array arms:

- `CollectionAssociation#_createRecord`: `attributes.collect { _createRecord(attr, raise, block) }`,
  guarded ahead of the single-record body, matching collection_association.rb:358-360.
- `HasManyAssociation#_createRecord`: the Array test that routes to plain
  `super` rather than `updateCounterIfSuccess(super, 1)`
  (has_many_association.rb:144-148).

Then drop the proxy's own Array loop for the non-through, non-singular arm so
`create([...])` reaches the ported recursion, and delete the two JSDoc notes
that record the absence.

## Acceptance criteria

- [ ] Both Array arms exist and match their Rails line ranges.
- [ ] `association.create([{...}, {...}])` returns an array of records, and the
      in-memory counter cache moves by the element count exactly once.
- [ ] The "Rails' Array arm has no counterpart here" notes on
      `CollectionAssociation#_createRecord` and
      `HasManyAssociation#_createRecord` are deleted.
- [ ] Existing has-many / collection-proxy / counter-cache suites stay green.
