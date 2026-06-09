---
title: "Converge collision-prone scratch tables (people / posts / items / HABTM joins)"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Enabling work for the whole burndown (RFC §"Collision-table convergence"). The
`people`, `posts`, `items`, and HABTM-join scratch tables are declared with
divergent column sets across many grandfathered files. Converting one consumer in
isolation gets **wrong-skipped** by the signature cache when a divergent sibling
re-primes it in the same worker — the documented `posts`/`items`/`people`
shared-DB flakes. The downstream collision-prone clusters (`relation-core`,
`callbacks-transactions`, `associations-*`, `calculations`) depend on this story
landing first.

This story does **not** do full body-fidelity on every consumer — it converges
the _schema_ so the others can. Per RFC, the rule: column-compatible offenders →
adopt the canonical model; column-incompatible offenders → rename the scratch
table to a file-unique name (`aco_people`, `sr_people`, …). Renaming a table is
allowed; renaming a test is not.

## Acceptance criteria

- [ ] Build the collision map: for `people`/`posts`/`items`/HABTM-join, list every
      grandfathered file declaring that table name with a non-canonical column set
      (seed list in `defineschema-to-fixtures-migration.md` §1/§Phase 1).
- [ ] Column-incompatible scratch definitions renamed to file-unique table names;
      tests unchanged in name and assertion.
- [ ] Column-compatible definitions converted to the canonical model + table.
- [ ] `dropExisting: true` shields removed from files whose only reason was a now-
      converged sibling (verify each removal by co-running the previously-shielded
      file with its offender under `maxForks=1`).
- [ ] The three shared-DB flake memories (`posts`/`items`/`people`) are
      re-verified as resolved (or annotated with residual cause).
- [ ] No `require-canonical-schema` regressions introduced; files fully converted
      here are removed from the exclude JSON.

## Notes

- Reproduction recipe for verifying convergence: real config, `maxForks=1`, co-run
  the colliding sibling (the #2766 / Story 7.4 recipe). Never run the whole AR
  suite locally (CLAUDE.md).
- MySQL has no TEMPLATE — adding a column to `TEST_SCHEMA` costs globalSetup time
  linearly in slots. Prefer rename; promote to `TEST_SCHEMA` only when Rails'
  `schema.rb` carries the column and ≥2 consumers need it.
- This story overlaps files later owned by cluster stories; the deps sequence it
  first so the edits don't race a sibling agent.
