---
title: "Owner-aware resolution for colliding port-index method names"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`indexPortTree` / `crossFileHits` (`scripts/prism-codegen/score.ts`) key the
global port index on the bare method name only, with no notion of which Rails
module a def belongs to. Common names therefore collide across unrelated files.

Observed while building `codegen:apply` (PR #5819): `createOrUpdate` from
`active_record/persistence.rb` resolves to hits in BOTH
`packages/activerecord/src/callbacks.ts` and
`packages/activerecord/src/timestamp.ts` — two different Rails modules that each
legitimately define their own `create_or_update`. `_createRecord` likewise
collides with `associations/association.ts`.

Consequences, both real:

- The scorer keeps such rows `missing` (its `hits.length === 1` gate), inflating
  the missing count with methods that ARE ported.
- `codegen:apply` refuses to scaffold them (deliberately — refusing beats
  writing a duplicate), so exactly the crowded-name methods can never be
  scaffolded.

## Acceptance criteria

- The global port index records the owning module/file for each def and matches
  a generated def against the hit whose owner corresponds to the Rails file the
  def was generated from, rather than treating every same-named def as a
  candidate.
- `createOrUpdate` (persistence.rb) resolves to the persistence-side definition
  instead of colliding, and `pnpm codegen:score` shows the corresponding
  `missing` rows reclassified; convergence baseline re-seeded accordingly.
- `codegen:apply` can scaffold a def whose bare name exists elsewhere but whose
  owner is unambiguous.
