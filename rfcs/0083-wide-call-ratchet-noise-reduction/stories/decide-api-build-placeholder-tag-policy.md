---
title: "Decide whether parity:api:build should keep minting inert placeholder @missingRailsCall tags"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 90
priority: 2
pr: 5857
claim: "2026-08-02T02:36:49Z"
assignee: "decide-api-build-placeholder-tag-policy"
blocked-by: null
closed-reason: null
---

## Context

PR #5754 made `@missingRailsCall` load-bearing, but only when its reason is
real per-entry prose: `justifies()`
(`scripts/api-compare/missing-rails-call-tags.ts`) rejects the seeded
`DEFAULT_REASON`. That guard is required — `parity:api:build` mints one placeholder
tag per still-missing call, so if placeholders suppressed, a single
`pnpm parity:api:build --package activerecord` run would move the whole ~3088-row wide
baseline into tags and zero the gate.

The consequence is that `parity:api:build` now writes tags that do nothing:
`pnpm parity:api:build --package arel --dry-run` reports 11 files would change and 0
baseline rows would migrate. Every one of those edits adds inert prose to a
source file — the reason still lives in the baseline JSON, and the tag is
decoration until a human replaces the placeholder.

Decide the policy and implement it. Options, in the author's order of
preference:

1. `parity:api:build` stops minting placeholder tags entirely and only writes a tag
   when it has curated prose to migrate (baseline `reason` !== DEFAULT_REASON).
   The generator then only ever produces load-bearing tags.
2. Keep minting them behind an explicit opt-in flag (`--seed-placeholders`) for
   an agent about to hand-write reasons for a cluster.
3. Keep current behavior and document that placeholder tags are scratch space.

Option 1 changes what `reconcile`/`renderEntry` emit but not the parser, and
would make `parity:api:build` idempotent-with-zero-edits on a tree whose deviations
are all still baselined.

## Acceptance criteria

- One policy chosen and implemented; the rejected options are noted in the PR
  body with why.
- `pnpm parity:api:build --package <pkg> --dry-run` on the merged tree reports 0 files
  changed when there is no curated reason to migrate (under option 1).
- `harvested` reporting still fires for a real reason being dropped — no
  human-authored prose is destroyed unseen.
- Existing `build.test.ts` coverage of reconcile/idempotency updated, not
  deleted.
