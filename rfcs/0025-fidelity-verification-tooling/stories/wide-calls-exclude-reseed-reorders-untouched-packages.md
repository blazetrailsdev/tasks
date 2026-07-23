---
title: "Make wide call-mismatch exclude emission order-stable across packages"
status: claimed
updated: 2026-07-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-23T21:47:10Z"
assignee: "wide-calls-exclude-reseed-reorders-untouched-packages"
blocked-by: null
closed-reason: null
---

## Context

`pnpm api:calls:wide --write` (`scripts/api-compare/lint-call-mismatches-wide.ts`)
reseeds the whole `scripts/api-compare/call-mismatches-wide-exclude/` tree, not
just the entries that changed. In PR #5023, a reseed driven purely by arel
changes also rewrote four unrelated files:

- `actioncontroller/metal/strong-parameters.json` (56 lines +/-)
- `activerecord/relation.json` (28 lines +/-)
- `activerecord/connection-adapters/abstract/connection-pool.json` (4)
- `activerecord/connection-adapters/postgresql/quoting.json` (2)

The counts are symmetric because the content is unchanged — entries are being
re-emitted in a different order. #5023 reverted those four paths by hand
(`git checkout -- <tree>`) to keep the diff reviewable, and the ratchet stayed
green afterwards, confirming the churn is cosmetic.

Cost: every agent that touches any wide-baselined package either ships
unexplained cross-package diff noise or has to know the manual revert trick.
Reviewers see a diff touching actioncontroller on an arel PR. It also invites
conflicts between sibling agents reseeding concurrently, since they will
reorder the same untouched files different ways.

This is distinct from `ratchet-exclude-emitters-prettier-churn`, which is about
routing generators through `writeJsonManifest()` for prettier-stable
_formatting_. This one is _entry ordering_ within the emitted JSON, and would
survive that fix.

## Acceptance criteria

- Identify why entry order is unstable across runs (likely an unsorted
  `Map`/`Set` iteration or a filesystem-walk order dependency in the wide-calls
  collector) rather than sorting at the write site as a band-aid, if the
  underlying source can be made deterministic.
- Emitted entries are in a stable, explicitly-defined order (sort key
  documented in the emitter).
- Re-running `--write` twice with no source changes produces byte-identical
  files, and a reseed driven by a change in one package leaves other packages'
  files untouched. Verify by diffing committed bytes, not by re-running the
  linter.
- Any one-time reordering of the tracked files is committed as its own commit,
  separate from the emitter change, so the mechanical diff is reviewable.
- The wide ratchet stays green across the reorder (baseline only shrinks; entry
  count must not change).
