---
title: "Relation#first returns cached records[0] when already loaded (no re-query)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `e3-connection-handling` (RFC 0030, PR #3460). Rails'
`Relation#first` returns `@records.first` when the relation is **already
loaded**, issuing no new query. Our `performFirst`
(`packages/activerecord/src/relation/finder-methods.ts:322`) instead always
`_clone()`s, sets `_limitValue = 1`, and re-runs `toArray()` — even when
`this._loaded` is true.

This forced a workaround in
`connection-adapters/connection-handlers-multi-db.test.ts` ("loading relations
with multi db connections"): the test had to read `records[0]` from the
`connected_to`-returned array instead of `relation.first`, because calling
`.first()` on the loaded relation re-queried in the default (writing) role pool
— where the `:memory:` table created under the `:secondary` role does not
exist, raising `no such table`.

Rails: `activerecord/lib/active_record/relation/finder_methods.rb#first` →
`find_nth` / `records.first` when `loaded?`.

## Acceptance criteria

- [ ] `performFirst` (and `performFirstBang`) return from the cached
      `_records` when `this._loaded` is true, with no new query — mirroring
      Rails `first`/`first!` loaded-relation behavior. Preserve the ordering
      semantics (implicit PK order applied at load time).
- [ ] The multi-db test can assert `relation.first` directly (drop the
      `records[0].readAttribute(...)` workaround) and still pass.
- [ ] No regression in existing finder-methods tests.
