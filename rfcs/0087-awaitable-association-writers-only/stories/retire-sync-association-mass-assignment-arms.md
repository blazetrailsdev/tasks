---
title: "retire-sync-association-mass-assignment-arms"
status: done
updated: 2026-08-06
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["delete-has-one-sync-property-setter", "delete-collection-sync-writers"]
deps-rfc: []
est-loc: 300
priority: 10
pr: 6155
claim: "2026-08-06T14:23:10Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

`assignAttributes` / `update` / `create` / `new` reaching an **association** key
currently route into the synchronous association writers
(`packages/activerecord/src/attribute-assignment.ts`, the `hasOne` and
collection arms). RFC 0087 §3: with those writers gone, the routing arms go too,
and each entry point takes the shape its own signature allows.

`update` and `create` are already async, so they can await the association write
where Rails' `assign_attributes` does it
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb`,
`_assign_attributes` → `public_send("#{k}=", v)`). `new Foo({ account: x })` keeps its
synchronous in-memory arm — resolved in RFC 0087's Open questions. A
constructor's owner is unpersisted by definition, so `save &&= owner.persisted?`
(`has_one_association.rb:66`), `remove_target!`'s `owner.persisted?` gate
(`:108`) and `find_target?` (`association.rb:320-322`, both disjuncts false for
has_one / has_many on a new owner) all make the path in-memory in Rails too. The
arm therefore stays and stays synchronous; there is no persistence-dependent
split to remove, because the owner cannot be persisted.

## Acceptance criteria

- [ ] The has_one / collection routing arms in `attribute-assignment.ts` are
      deleted.
- [ ] `update` / `create` await the association write inline.
- [ ] The constructor arm still assigns associations in memory, synchronously,
      and a test pins that `new Foo({ account: x })` issues no query.
- [ ] `pnpm parity:test` delta non-negative.
