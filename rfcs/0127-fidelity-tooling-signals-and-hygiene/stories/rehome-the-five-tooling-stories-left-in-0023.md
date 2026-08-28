---
title: "Re-home the five tooling stories left open in retired RFC 0023"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7164 retired `0023-surfaced-deviations` as the catch-all and carried 592 of
its 597 open stories into per-package `<package>-surfaced-deviations` buckets.
**Five open stories were deliberately left behind** because their subject is the
parity toolchain or the tasks CLI, not any package, so no package bucket fits:

- `ar-dump-prewarm-should-fail-fast`
- `call-arg-comparator-cannot-pair-ruby-to-s`
- `classify-permanence-on-unclassified-norailsequivalent`
- `fix-epipe-gate-inversion-in-gate-trace`
- `tasks-cli-invalid-time-value-breaks-list-and-show`

0023's README now says it is retired, so these five sit in an RFC that no longer
takes intake — they are reachable only by direct id lookup and will not surface
in a bucket sweep.

`0023-surfaced-deviations` §Non-goals already names "infrastructure and tooling"
as out of scope for that bucket, which is why they should not have been there in
the first place.

## Acceptance criteria

- Each of the five is re-homed to the RFC that owns its surface, or closed with
  a reason if re-verification against `origin/main` shows it is already fixed:
  the first four are parity-tooling defects (`0126-fidelity-tooling-continuation`
  / `0127-fidelity-tooling-signals-and-hygiene` are the candidates, chosen per
  story by whether the deliverable is a new tool/signal or a fix to an existing
  one); `tasks-cli-invalid-time-value-breaks-list-and-show` is a tasks-repo CLI
  bug and belongs to the tasks repo's own RFC, not trails'.
- Each premise is re-verified against today's `origin/main` before the move —
  `tasks-cli-invalid-time-value-breaks-list-and-show` in particular still
  reproduces (`pnpm tasks list --rfc 0023-surfaced-deviations` exits 1 with
  `error: Invalid time value`), so confirm the others the same way.
- `0023-surfaced-deviations` is left with zero open stories, making its retired
  status true rather than aspirational.
