---
title: "Rebase new-owner seed for updateAll/deleteAll/touchAll mutation terminals"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: null
pr: null
claim: "2026-07-14T13:22:36Z"
assignee: "rebase-new-owner-seed-for-mutation-terminals"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4859 (rebase-new-owner-seed-for-count-exists-pluck-terminals),
which consolidated the stale new-owner `1=0` seed rebase behind a single
none-short-circuit chokepoint, `Relation#_isEmptyRelation()` (relation.ts:6264),
overridden in `AssociationRelation` to rebase before reporting `_isNone`. Every
READ terminal now routes through it (`toArray`/`exists`/`pluck`/`count`+aggregates/
the bounded finders).

The MUTATION terminals were left out of scope and still short-circuit on the raw
`this._isNone` field instead of `_isEmptyRelation()`:

- `updateAll` — packages/activerecord/src/relation.ts:3693, 3706, 3713
- `deleteAll` — packages/activerecord/src/relation.ts:3800
- `touchAll` — packages/activerecord/src/relation.ts:3877
- `updateCounters` — packages/activerecord/src/relation.ts:6045

So a relation spawned off a new-owner seed (`owner.things.where(...)`) still
returns 0 / affects no rows on these after the owner is saved:

```ts
const author = new Author({ name: "Gap" });
const rel = association(author, "posts").where({ title: "GG" }); // 1=0 seed
await author.save();
await Post.create({ title: "GG", author_id: author.id });
await rel.updateAll({ title: "H" }); // 0 rows (should update the persisted row)
await rel.deleteAll(); // 0 rows (should delete it)
```

Rails' CollectionProxy delegates every query — including `update_all`/`delete_all`
— to the live `association.scope`, so all of them resolve the persisted FK.

## Acceptance criteria

- [ ] `updateAll`/`deleteAll`/`touchAll`/`updateCounters` on a relation spawned
      off a new-owner seed resolve the persisted FK after `save`.
- [ ] Route these mutation short-circuits through `_isEmptyRelation()` (the same
      chokepoint the read terminals use), rather than reading `_isNone` directly.
      Note: `execMainQuery` (relation.ts:7038) is a downstream internal guard
      reached only after a terminal already ran the chokepoint — leave it on
      `_isNone`.
- [ ] Regression tests covering updateAll + deleteAll on a spawned new-owner-seed
      relation (has_many; HABTM if the join makes it distinct), mirroring the
      read-terminal tests from PR #4859.
