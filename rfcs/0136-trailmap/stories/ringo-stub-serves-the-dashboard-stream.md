---
title: "ringo:stub serves /events and the reviewer list, so /dashboard can be screenshot"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
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

`scripts/ringo-stub.ts` (trailmap) answers only the session-archive endpoints
(`/api/sessions`, `/api/sessions/status`, `/api/sessions/timeline`,
`/sessions/file`). `/dashboard` reads ringo's `/events` stream and
`/reviewer/list`, which the stub answers with 404. So with `RINGO_BASE` set to the
stub, the dashboard has no session rows, and a PR that changes a row cannot be
screenshot as CLAUDE.md requires.

To take its screenshots, trailmap#173 wrote a throwaway ringo outside the repo. It
served one `/events` frame of four PRs and a `/reviewer/list` with a reviewer on
two of them. `scripts/dashboard-e2e.ts:68` already has a fuller version of that
server, but only inside the e2e harness.

Expected shape: `pnpm ringo:stub` also serves `/events` (one envelope frame, held
open), `/reviewer/list`, `/reviewer/config`, `/broadcast/targets`,
`/usage-status` and `/ask/list`. Their bodies come from a fixture under
`test/fixtures/ringo-archive/` with one PR in each stage. Ideally
`dashboard-e2e.ts` reads the same fixture instead of keeping its own copy.

## Acceptance criteria

- With `RINGO_BASE` pointed at `pnpm ringo:stub`, `/dashboard` shows at least one
  row in each of Getting CI green, Reviewer convergence and Ready to merge,
  including a green PR with a reviewer assigned and no findings (Ready to merge).
- The fixture is the only copy of the envelope: the stub reads it, and
  `scripts/dashboard-e2e.ts` reads it too or the PR says why not.
- The script's header comment names `/dashboard` next to `/sessions`.
