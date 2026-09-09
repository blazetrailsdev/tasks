---
title: "Nothing notices when vendor/ringo falls behind btwhooks and the gates pass against a stale ringo"
status: done
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: 20
claim: "2026-09-09T15:00:55Z"
assignee: "deployed-rfcs-index-500s-with-connectionnotdefined"
blocked-by: null
closed-reason: null
---

## Context

`vendor/ringo/PIN` records the btwhooks commit both ringo gates diff against,
and `SHA256` makes the snapshot tamper-evident — `scripts/ringo-pin.ts` fails
the gate if a vendored file was edited by hand. Nothing, however, notices when
the snapshot goes STALE: if ringo's `/backlog` script changes tomorrow, both
gates keep passing, green, against a copy of the old ringo, and the drift they
exist to catch is invisible for exactly as long as nobody remembers to run
`scripts/vendor-ringo.sh`.

This is the failure mode the tamper check does not cover: the file is
untouched, and that is the problem.

## Expected shape

A check that compares `vendor/ringo/PIN` against btwhooks' current HEAD and
says so when they differ. It cannot be a CI job — CI has no btwhooks checkout,
which is why the snapshot is vendored at all — so it belongs where a checkout
exists: a `pnpm` script run on the box, or ringo's own cron reporting it, or
the deploy path. Warn rather than fail: a bump is its own PR by design, and a
stale pin is a prompt, not a broken gate.

## Acceptance criteria

- Something reports the drift between `PIN` and btwhooks HEAD, naming both.
- It does not fail CI, which cannot see btwhooks.
- The README's vendoring section says where the alarm lives.
