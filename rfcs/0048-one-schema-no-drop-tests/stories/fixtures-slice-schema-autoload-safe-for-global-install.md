---
title: "Bound fixture schema slicing so the canonical autoload index can install globally"
status: done
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 4603
claim: "2026-07-05T11:52:27Z"
assignee: "fixtures-slice-schema-autoload-safe-for-global-install"
blocked-by: null
closed-reason: null
---

## Context

PR #4588 (`fixtures-autoload-canonical-model-index`) landed the canonical-model
autoload fallback (Zeitwerk analog): `resolveModel` / reflection `computeClass`
consult an eager name→class index on a `modelRegistry` miss. It had to ship
**opt-in per test file** (a file imports `test-helpers/canonical-model-index.js`
directly) rather than globally via `fixtures.ts`, because a global install
regressed schema derivation.

Root cause: `sliceSchema` / `deriveFixtureSchema`
(`packages/activerecord/src/test-helpers/use-fixtures.ts`) walk through/HABTM
reflections purely to detect join tables (`throughLabelAssociations` in
`test-helpers/define-fixtures.ts` reads `r.throughReflection?.klass` /
`.tableName` / `r.klass?.tableName`), and rely on **unregistered targets
throwing** to bound the set. With autoload active those resolve, so the derived
schema balloons from the requested sets to every transitively-reachable table
(`use-fixtures.test.ts:424` — 14 tables vs 3, red on SQLite + MariaDB).
Suppressing autoload during the walk is NOT viable: the through-source
reflection caches its result (`_sourceReflectionNameCache`) on the shared
reflection object, so a suppressed resolution caches null permanently and
breaks later runtime navigation (`HasManyThroughSourceAssociationNotFoundError`
at reflection.ts:1817).

## Acceptance criteria

- [ ] `sliceSchema`/`throughLabelAssociations` bound their join-table walk to
      models genuinely present in `modelRegistry`, WITHOUT relying on
      resolution throwing and WITHOUT poisoning reflection caches (no
      suppression flag that caches a null source-reflection name).
- [ ] With that in place, the canonical autoload index can be installed
      globally (e.g. re-add the `fixtures.ts` side-effect import) and
      `deriveFixtureSchema(["authors","posts"], TEST_SCHEMA)` still yields
      exactly `[authors, posts, categories_posts]`.
- [ ] The eager barrel-load cost is not paid by fixtures tests that don't use
      autoload (or is measured acceptable): the PG `schema-dumping-helper.test.ts`
      5s dump does not regress.
- [ ] No test names change; test:compare does not regress.

## Notes

Gates the broad rollout of registration-deletion across converted canonical
files (see sibling rollout story). See memory
`project_canonical_autoload_index_must_be_opt_in`.
