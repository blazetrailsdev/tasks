---
title: "The trails rename family (Trailtie, Trails) reports as novel declaration extras"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Parity-report noise about the deliberate Trailtie/Trails rename family; advisory only (untagged extras do not gate), no behavioural divergence."
---

## Context

Surfaced by PR 5653, which made declaration names count as extra surface.
14 of the new extras are the deliberate trails rename family — the TS
declaration is named after trails, the Rails constant it ports is not:

- `Trailtie` for `Railtie` (`trailtie.ts` in actioncontroller, actiondispatch,
  actionview, activemodel, activerecord, trailties)
- `TrailtieConfig` (activemodel/trailtie.ts)
- `Trailties` (trailties/engine/trailties.ts) for `Rails::Railtie` collection
- `Trails` (trailties/rails.ts) for `Rails`
- `TrailsRoot` (activesupport/trails-root.ts), `TrailsActionsHost`,
  `TrailsPluginOptions`, `TrailsAdapterOptions`

A name-based comparator has no way to know these are renames rather than
drift, so each reports as a novel declaration extra. The report is advisory
(untagged extras do not affect the exit code), but the entries are permanent
noise unless the rename is either recorded as a mapping or tagged.

## Acceptance criteria

- Decide how the rename family is recorded: a Rails-name mapping the comparator
  consults (cf. `rubyFileToTs` / `conventions.ts`), or a PERMANENT
  `@noRailsEquivalent` tag on each declaration.
- The 14 entries stop reading as unexplained novel surface.
- `pnpm parity:api:extra` exits 0 with no stale tags.
