---
title: "Rehearsal: retire the 8.0.5.1 ledger, write the retrospective, re-measure the 8.1.4 bump"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: rehearsal
packages: [scripts]
deps: [generate-the-rails-8-0-5-1-burn-down-stories]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 1 "Two flips". The rehearsal is worth its second flip only if what it
teaches is written down and fed into the 8.1.4 plan. This story closes the
rehearsal and is the gate on `flip-the-rails-ref-to-v8-1-4`. It waits on the
generated 8.0.5.1 burn-down RFC; add that `deps-rfc` edge with
`tasks set-deps-rfc` once it has a number.

## Acceptance criteria

- [ ] `scripts/parity/bump-ledger/rails.json` has no rows and is deleted.
      `pnpm parity:api:pins` reports 0 DRIFT and 0 STALE at `v8.0.5.1`, and
      `pnpm parity:api:pins:all` leaves 0 unpinned matched bodies in the
      Rails packages, which is the floor the 8.1.4 flip seeds from.
- [ ] The citations `vendor:recite` rewrote for 8.0.5.1 are re-read against
      the new tree, as
      `reread-the-recited-rails-citations-against-v8-1-4` does for 8.1.4.
- [ ] No baseline or mark is wider than at the `rails-8.0.2` tag.
- [ ] A retrospective is added to the RFC as a dated Changelog entry and a
      short section: dry-run prediction against what happened, per gate; each
      gate that was "not exercised" and how it behaved; ledger rows opened,
      days to empty, PRs merged, taken from the stats DB; every change made to
      the tooling during the rehearsal.
- [ ] `pnpm parity:bump:dry-run --source rails --ref <latest v8.1.x>` is run
      from the `v8.0.5.1` base, its report committed, and RFC § 2's tables and
      every row count in § 3 and § Verification replaced with the new
      figures. The latest 8.1 tag is re-resolved; if it is past `v8.1.4`, the
      RFC's target and the flip story move to it.
- [ ] Any rule of RFC § 3 the rehearsal showed to be wrong is corrected, and
      the correction is listed for the owner before the 8.1 flip opens.

## Definition of done

Deleting ledger rows that were not re-verified does not close this story.
