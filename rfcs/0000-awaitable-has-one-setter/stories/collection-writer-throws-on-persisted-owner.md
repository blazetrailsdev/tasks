---
title: "Collection = / ids= assignment throws on persisted owners; retire persisted-owner _pendingReplace"
status: ready
updated: 2026-07-17
rfc: "0000-awaitable-has-one-setter"
cluster: null
deps: ["retire-has-one-displacement-machinery"]
deps-rfc: []
est-loc: 400
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `CollectionAssociation#writer` → `replace`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:46-48`, `:242`)
does immediate DB work (`replace_records` in a transaction) for a persisted
owner — the same unawaitable-at-assignment shape as has_one. Trails defers
via `_pendingReplace`
(`packages/activerecord/src/associations/collection-association.ts:37`,
`:503-517`), flushed at the owner's save — the same deviation class, with the
same latent window (deferred deletes racing interim inserts).

Per this RFC's Design §5: the native collection setter
(`packages/activerecord/src/associations/builder/collection-association.ts:146-159`
wires both `name=` via the base `defineWriters` and `#{singular}Ids=` via
`idsWriter`) throws for a persisted owner, pointing at the awaitable
Rails-named methods (`await owner.items.replace([...])`, `concat`,
`destroy`); new-owner assignment stays in-memory (Rails defers there too —
`replace_on_target` without save). The persisted-owner half of
`_pendingReplace` is then unreachable and removed; the new-owner half stays.
belongs_to is explicitly OUT of scope — Rails' `BelongsToAssociation#replace`
(`belongs_to_association.rb:95-107`) is purely in-memory, so its native
setter is already faithful.

## Acceptance criteria

- [ ] `owner.items = [...]` and `owner.itemIds = [...]` on a persisted owner
      throw an error naming the awaitable replacement; unpersisted owners
      keep in-memory assignment.
- [ ] Mass-assignment collection arm
      (`packages/activerecord/src/attribute-assignment.ts:176-184`) gets the
      same persisted-owner throw.
- [ ] Persisted-owner `_pendingReplace` machinery removed from
      `collection-association.ts`; new-owner flush kept and its JSDoc updated
      to the Rails citation.
- [ ] In-repo persisted-owner collection-assignment sites migrated to
      `replace`/`concat`; no test renames.
- [ ] belongs_to setter untouched.

## Verification

`pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts packages/activerecord/src/associations/collection-association.test.ts`
