---
title: "retire-sync-association-mass-assignment-arms"
status: draft
updated: 2026-08-03
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["delete-has-one-sync-property-setter", "delete-collection-sync-writers"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
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
`_assign_attributes` → `public_send("#{k}=", v)`). `new Foo({ account: x })` has
no awaitable form to redirect to — RFC 0087's one open question. Rails' `new`
does assign the association in memory, which argues for keeping an in-memory
arm; but that reintroduces exactly the persistence-dependent split RFC 0087
exists to remove, which argues for a throw naming `await foo.setAccount(x)`.
Resolve it here and record the resolution in the RFC's Open questions section.

## Acceptance criteria

- [ ] The has_one / collection routing arms in `attribute-assignment.ts` are
      deleted.
- [ ] `update` / `create` await the association write inline.
- [ ] The constructor arm's behavior is decided, implemented, and recorded in
      RFC 0087 Open questions (throw vs in-memory, with the Rails cite).
- [ ] `pnpm test:compare` delta non-negative.
