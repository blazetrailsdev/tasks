---
title: "activerecord: Relation#_isRecordsSynchronous is an invented public predicate with no receipt"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8708, which replaced `isRecordsLoaded`, `isEachSynchronous` and the re-check in `withRecords` with one predicate.

`Relation#_isRecordsSynchronous` (`packages/activerecord/src/relation.ts`) answers `isLoaded && !isScheduled && !_loadResult`, and `CollectionProxy` overrides it to add `!association.isFindTarget()` (`packages/activerecord/src/associations/collection-proxy.ts`), the condition `CollectionAssociation#load_target` branches on (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:272-279`). It is read by the relation Proxy handler to hide `[Symbol.iterator]`, by `withRecords` (`packages/activerecord/src/relation/delegation.ts`) and by `Relation#toAry`.

Rails has no such member: `each` is delegated to `records` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:103-105`), which is synchronous. The member is public and carries no receipt. Its leading underscore keeps it out of `pnpm parity:api:extra`, so no gate reports it. `packages/activerecord/CLAUDE.md` § "`Relation` is evaluated by an async query" ratifies four shapes by name and this is not one of them.

`withRecords` also reads `host.proxyAssociation!.loadTarget()` to run `loaded!` for an unloaded proxy whose owner is new, and `Association#isFindTarget` was made public for the override, where Rails' `find_target?` is private (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb`).

## Acceptance criteria

- [ ] Either the owner adds the predicate to the ratified section and it carries `@noRailsEquivalent PERMANENT`, or it is removed: `records` on a proxy answers `load_target` directly and the handler decides iterator visibility from a member Rails has.
- [ ] `Association#isFindTarget` is `protected` again, or the reason it is not is recorded with the predicate's receipt.
- [ ] `collection-proxy.trails.test.ts` "iterates the built records of a new owner" and "is not iterable, and starts no load" stay green.
