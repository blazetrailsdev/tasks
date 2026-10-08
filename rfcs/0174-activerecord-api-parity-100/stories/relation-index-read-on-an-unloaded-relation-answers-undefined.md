---
title: "activerecord: an index read on an unloaded relation goes through records, not a silent undefined"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8668 (review finding B, then a CI red on the first attempt at fixing it).

Rails delegates `[]` on a relation to `records` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:98-102`), and `records` loads (`relation.rb:342-345`). So `Post.where(...)[0]` runs the query and answers the first record.

In trails the ClassSpecificRelation Proxy's numeric-index arm (`packages/activerecord/src/relation.ts`, `CLASS_SPECIFIC_RELATION_HANDLER`) answers a promise only while a load is pending (`isScheduled || _loadResult`). Otherwise it reads `(target.target ?? target._records)[n]` synchronously. On a relation that has not been loaded, that is `undefined`, with no query and no error.

trails#8668 tried widening the promise arm to every unloaded relation. That turned `part.trinkets[0]` on an unsaved owner into a promise and reddened "strong params style objects work with collection associations" (`packages/activerecord/src/forbidden-attributes-protection.test.ts`, mirroring `test/cases/forbidden_attributes_protection_test.rb:127`) on the SQLite and MariaDB lanes, so it was narrowed back.

The enumerable arm beside it already goes through `records()` when `!isLoaded`, so the two arms disagree for an unloaded relation.

## Acceptance criteria

- [ ] An index read on an unloaded plain relation does not answer a silent `undefined`: it goes through `records()` as the enumerable arm does, matching `delegation.rb:98-102`.
- [ ] An index read on a collection proxy whose target is already in memory (an unsaved owner's built records) still answers synchronously, so `forbidden-attributes-protection.test.ts` stays green without edits to its assertions.
- [ ] A trails test pins both cases.
- [ ] `relation/`, `associations/` and `nested-attributes.test.ts` pass on the default and `ARCONN=sqlite3_mem` lanes.
