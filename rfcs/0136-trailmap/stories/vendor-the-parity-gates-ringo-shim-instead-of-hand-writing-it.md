---
title: "Generate the parity gate's ringo shim from the pin instead of hand-writing envOr and parityHTML"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trailmap#90
claim: "2026-10-28T15:10:51Z"
assignee: "up-ready-does-not-assert-the-hub-migration-head"
blocked-by: null
closed-reason: null
---

## Context

trailmap#69 put ringo's parity handler in CI by compiling
`vendor/ringo/db/parity.go` into a throwaway module
(`scripts/ringo-parity-answers.sh`). That file is one of several in ringo's
`webhook` package and takes two names from the others, so
`scripts/ringo-parity/shim.go` supplies them:

- `envOr`, a four-line copy of ringo's (`webhook/spawnloop.go:394` at the pin);
- `const parityHTML = ""`, a placeholder so `HandleParityPage` links. The gate
  never calls it.

Both are hand-written stand-ins for ringo code, in a gate whose whole argument
is that it runs ringo's code and not a reading of it. Two ways it can go wrong
silently:

- ringo's `parity.go` starts using a third package-level name. The gate then
  fails to compile in CI on the next pin bump, with a Go error rather than a
  message saying the shim is stale — loud, but confusing.
- ringo changes `envOr`'s behaviour (say, trimming whitespace). The copy does
  not follow, and the gate compares against a handler configured differently
  from the deployed one.

## Do

Have `scripts/vendor-ringo.sh` produce what the shim hand-writes, at the pin:
extract `envOr` verbatim from wherever ringo defines it into
`vendor/ringo/parity/`, and fail the vendor run by name if `parity.go`
references a package-level identifier that neither it nor the vendored files
define. `parityHTML` either becomes the page `HandleParityPage` really prints —
the script already has it in `$page` — or the placeholder moves into the
generated file with a header saying what it is.

## Acceptance criteria

- [ ] `scripts/ringo-parity/shim.go` is gone or generated; no hand-written
      copy of a ringo function remains under `scripts/`
- [ ] a vendor run against a ringo whose `parity.go` uses a new package-level
      name fails in `vendor-ringo.sh`, naming the identifier
- [ ] `pnpm gate:parity --fixture` and its self-test still pass
