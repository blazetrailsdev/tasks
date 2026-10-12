---
title: "Bump the vendored ringo pin to 0eeb2e1: the write path and the smoke cards"
status: draft
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ringo/PIN` is `faf67c0`. ringo's `main` is `0eeb2e1`, which is the pin
plus 47 commits, among them:

- `31140dc` — the three smoke-tier cards on `/crons` (deployed 2026-10-12);
- `0eeb2e1` — `webhook/taskswrite.go`, the write path the write protocol
  requires (ack after commit, `SQLITE_BUSY` and schema-error retry). No caller
  and no `sql.Open` yet.

trailmap#69 could not bump it: bumping is its own PR (CLAUDE.md), so a gate
that goes red can be reverted without taking application work with it. A trial
re-vendor at `0eeb2e1` on that branch showed what to expect:

- 16 files change, 66 insertions and 31 deletions, plus a new
  `vendor/ringo/db/taskswrite.go`, which the SQL-site discovery in
  `scripts/vendor-ringo.sh` picks up on its own;
- `test/config/write-protocol.test.ts`, `test/scripts/ringo-pin*.test.ts` and
  `pnpm gate:parity --fixture` passed against it;
- `rfcs-draw.js` and `backlog-draw.js` change, and `pnpm gate:lists` was NOT
  run against the new pin. It is the gate most likely to go red.

`docs/write-protocol.md` already cites `0eeb2e1` for ringo's implementation, so
until this lands the doc describes code the vendored snapshot does not hold.

## Do

`./scripts/vendor-ringo.sh ~/github/deanmarano/btwebooks main`, and nothing
else in the PR. If `gate:lists` or `gate:markdown` goes red, the difference is
a port to update in the same PR or a ringo change to question, not a variance.

## Acceptance criteria

- [ ] `vendor/ringo/PIN` names a ringo commit at or after `0eeb2e1`, and
      `vendor/ringo/db/taskswrite.go` exists
- [ ] every job in CI is green on the bump alone, `gate` and `parity-gate`
      included
- [ ] `pnpm ringo:pin` reports the pin as fresh on the box
