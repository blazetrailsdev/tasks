---
title: "Call-args recorder pairs a Ruby `raise X.new(...)` with an unrelated TS `new` (activerecord migrationsStatus)"
status: done
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8025
claim: "2026-09-24T12:22:00Z"
assignee: "retire-q-suffix-crediting-in-extra-surface-and-naming"
blocked-by: null
closed-reason: null
---

## Context

RFC 0153 wave W5 follow-up, split from `naming-burndown-activerecord-remaining` (trails#8022). The Ruby recorder records the `new` inside `raise X.new(args)` as a call. The TS extractor drops a thrown construction (`isThrownConstruction`, `scripts/api-compare/extract-ts-api.ts`), so the Ruby `new` pairs with whatever unrelated `new` the TS body has:

- `migration.rb:1324` `raise IllegalMigrationNameError.new(file) unless version` pairs with `new Set(await this.schemaMigration.normalizedVersions())` in `migration.ts` `migrationsStatus`. The row is recorded as `new(ref:file)` vs `new(ref:normalizedVersions)`, classified `burndown`.

No rename can close the row. The other three recorder rows first grouped here, `relation.ts#toSql` `to_sql`, `scoping/default.ts#buildDefaultScope` `scope` and `relation/finder-methods.ts#raiseRecordNotFoundExceptionBang` `pluralize`, are the local-receiver and core-ext shapes that `call-args-receiver-as-argument-local-and-core-ext` already owns. They are left to that story.

## Acceptance criteria

- [ ] The two recorders agree on a construction inside `raise` / `throw`: both record it, or both skip it.
- [ ] A recorder unit test covers `raise X.new(arg)` next to an unrelated `new`.
- [ ] `migration.ts#migrationsStatus` `new` no longer shows as a `burndown` row.
