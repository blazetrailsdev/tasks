---
title: "create does not read DB-generated value back into a custom-named serial PK on PostgreSQL"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `touch_later_test.rb` in #3294
(f9g3b3-touch-later-association-propagation).

On PostgreSQL, `Model.create` does **not** populate the in-memory record's
custom-named serial PK with the value the DB actually generated. For a model
with `self.primary_key = :owner_id` (e.g. `Owner`, `Pet`) backed by an
identity/serial column:

```ts
const owner = await Owner.create({ name: "blackbeard" }); // DB INSERT → owner_id = 2
owner.readAttribute("owner_id"); // => 1  (stale; should be 2)
await Owner.find(owner.readAttribute("owner_id")); // RecordNotFound
```

When the sequence happens to be at 1 (fresh table) the stale in-memory value
coincidentally matches, masking the bug; it only manifests once the sequence
has advanced (e.g. a prior transactional-fixtures test consumed a value — PG
sequences are non-transactional, so rollback does not reset them). The
default `id` PK reads back correctly, so the gap is specific to a
**custom-named** serial PK and the INSERT…RETURNING / lastval mapping not
keying off `klass.primaryKey`.

Distinct from the now-done `defineschema-custom-named-integer-pk-not-serial-pg`
(#3276), which fixed the **DDL** side (emitting the identity column). This is
the **readback** side. Workaround in #3294 was to seed those models via
`useHandlerFixtures` (explicit PKs + sequence reset) instead of `create`.

Rails populates the PK attribute after insert regardless of column name
(`ActiveRecord::Persistence#_create_record` → `@new_record = false; self.id =
new_id`, where `id=` writes through to the configured primary key).

## Acceptance criteria

- [ ] `Model.create` / `save` on a model with a custom-named serial/identity PK
      writes the DB-generated value back into that PK attribute on PostgreSQL
      (and the equivalent on MySQL).
- [ ] A regression test creates such a record after the sequence has advanced
      and asserts the in-memory PK equals the persisted row, then re-finds it.
- [ ] Consider whether the `useHandlerFixtures` workaround in
      `touch-later.test.ts` can be reverted to plain `create` once fixed
      (optional; fixtures are also acceptable).
