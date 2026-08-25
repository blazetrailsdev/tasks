---
title: "materialize-declares-large-bakes-reflection-autosave-hasmany"
status: done
updated: 2026-07-04
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4559
claim: "2026-07-04T17:19:27Z"
assignee: "materialize-declares-large-bakes-reflection-autosave-hasmany"
blocked-by: null
---

## Context

Continuation of `materialize-declares-nested-remaining-bakes-followup`
(PR TBD), which baked the small clean files
(association-scope.test.ts +102, has-one-through-associations.test.ts +252,
belongs-to-associations.test.ts +39) in one ≤500-LOC PR. The following files
still need materialized `declare` accessors baked via
`pnpm tsx scripts/materialize-model-declares.ts <file>` (from
packages/activerecord), `prettier --write`, `pnpm eslint`. Each is a clean
generator run (verified `materialized ... (+N lines)` with no broken output),
but each exceeds the ≤500-LOC PR ceiling on its own or in combination, so they
must ship as separate PRs (each from main, non-overlapping files, NO stacks):

- reflection.test.ts (+346 generated) — fits one PR.
- autosave-association.test.ts (+594 generated) — single-file generated bake,
  > 500 LOC; mechanical/generated, note in PR body.
- has-many-associations.test.ts (+811 generated) — single-file generated bake,
  > 500 LOC; mechanical/generated, note in PR body.

NOTE: `has-many-through-associations.test.ts` is intentionally NOT in this
list — it hits the dynamic-import `.then` generator-misparse bug and is routed
to its own generator-fix story.

## Acceptance criteria

- [ ] Each listed file has materialized `declare` accessors baked via the
      generator (no phantom canonical columns).
- [ ] `pnpm typecheck` green; affected suites green; declares types-only.
- [ ] Single-file bakes >500 LOC are mechanical/generated (note in PR body).
      NO stacked PRs; each PR from main with non-overlapping files.
