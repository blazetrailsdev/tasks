---
title: "Bake remaining nested-class declares (13 files, after id-accessor generator fix)"
status: ready
updated: 2026-06-25
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `materialize-declares-nested-remaining-bakes` (PR #4119), which
baked only the two files with no `id`-declaring nested classes
(transaction-callbacks.test.ts +126, test-fixtures.ts +140). The remaining
files from that story's list are blocked by the generator `declare id` /
`Base#id` accessor gap (TS2610) — see story
`materialize-declares-nested-generator-gaps` / the id-accessor generator-fix
story. Once that fix lands, bake the rest via
`pnpm tsx scripts/materialize-model-declares.ts <file>` (from
packages/activerecord), `prettier --write`, `pnpm eslint`, in <=500-LOC PRs
(each PR a non-overlapping subset, branched from main — NO stacked PRs).

Remaining files (approx generated additions):

- timestamp.test.ts (+113)
- associations/association-scope.test.ts (+198)
- associations/nested-through-associations.test.ts (+226)
- associations/has-one-through-associations.test.ts (+267)
- relation/where.test.ts (+450)
- strict-loading.test.ts (+469)
- reflection.test.ts (+551)
- counter-cache.test.ts (+604)
- autosave-association.test.ts (+646)
- associations/belongs-to-associations.test.ts (+739)
- calculations.test.ts (+1037)
- associations/has-many-associations.test.ts (+1308)
- associations/has-many-through-associations.test.ts (+1724)

## Acceptance criteria

- [ ] All listed files have materialized `declare` accessors baked in via the
      generator (no phantom canonical columns).
- [ ] `pnpm typecheck` green; affected suites green; declares are types-only
      (no behavior change).
- [ ] Single-file bakes >500 LOC are mechanical/generated (note in PR body).
      NO stacked PRs; each PR from main with non-overlapping files.
- [ ] Any file still hitting a generator gap is routed to the relevant
      generator-fix story rather than baked with broken declares.
