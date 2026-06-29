---
title: "assoc-associations-suite-canonical-wave-b"
status: done
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4242
claim: "2026-06-28T20:26:39Z"
assignee: "assoc-associations-suite-canonical-wave-b"
blocked-by: null
---

## Context

`associations.test.ts` wave A (PreloaderTest) landed. Remaining bespoke classes:

- `OverridingAssociationsTest` (lines ~1574-1752): `DifferentPerson`, `PeopleList`, `DifferentPeopleList`, `OaArgTest`, `ModelAssociatedToClassesThatDoNotExist` — no DB activity, just reflection tests; `PeopleList` uses a bespoke `people_lists` table (not in Rails schema.rb, no canonical equivalent). These tests test association reflection overriding behavior. Since `people_lists` is not a real Rails table, `DifferentPerson`/`PeopleList`/`DifferentPeopleList` must stay inline; `OaArgTest`/`ModelAssociatedToClassesThatDoNotExist` can be refactored inline to remove the class keyword.

- `GeneratedMethodsTest` (line ~1684): one inline `Post` class defining a `tag` belongsTo. This can use the canonical `Post` model or a simpler reflectOnAssociation pattern.

- `WithAnnotationsTest` (lines ~1701-1751): six inline `Post` classes each with a single attribute — these just call `.annotate().toSql()`. They can use canonical `Post` directly.

- Second `AssociationsTest` `AnonCollectionKeys` class (line ~1978): inline class for testing anonymous class FK detection — keep inline (functional requirement).

Rails test file: `vendor/rails/activerecord/test/cases/associations_test.rb`.

## Acceptance criteria

- [ ] OverridingAssociationsTest bespoke classes reviewed; `PeopleList` stays inline (no canonical table), but `setupHandlerSuite`/`useHandlerTransactionalFixtures` can be removed (no DB needed).
- [ ] GeneratedMethodsTest `Post` inline class replaced with canonical Post model if possible; otherwise refactored to not declare a new class.
- [ ] WithAnnotationsTest inline `Post` classes removed; use canonical Post with `.annotate().toSql()`.
- [ ] `AnonCollectionKeys` inline class kept (justified).
- [ ] `AnimalsBase`/`OtherDog` inline classes kept (multi-db test, justified by comment).
- [ ] File removed from `eslint/require-canonical-schema-exclude.json` once fully converted.
- [ ] `pnpm lint` clean, no `eslint-disable`.
- [ ] All tests pass.
