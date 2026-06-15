---
title: "Route all jobs through the setup-pnpm composite and add --prefer-offline"
status: draft
updated: 2026-06-14
rfc: "0000-ci-cost-optimization"
cluster: caching-install
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`.github/actions/setup-pnpm/action.yml` is the canonical setup step: it picks
hosted-vs-self-hosted pnpm + cache strategy and pins third-party actions by
SHA. Only a handful of jobs use it (`build-and-typecheck`, `lint`,
`guides-typecheck`, `dx-type-tests`, `rack/actionpack/actionview/trailties/
tse-compiler-tests` via `./.github/actions/setup-pnpm`). The rest —
`virtualized-dx-type-tests`, `unit-tests`, all three AR jobs (`sqlite-tests`,
`postgres-tests`, `maria-tests`, plus the disabled `mysql-tests`), `website`,
`rails-comparison`, and every `schema-parity-*` / `query-parity-*` job — inline
`pnpm/action-setup@v4` + `actions/setup-node@v4 (cache: pnpm)` by hand.

That inconsistency means: (a) the self-hosted/WAN-safe branch in the composite
is silently bypassed by the inlined jobs (the exact failure mode behind the
documented ~1 TB WAN egress incident); (b) install tuning can't be changed in
one place. This is the **foundational** story — it unblocks
`cache-build-dist-across-jobs` and any future install/runner tuning.

Every job runs `pnpm install --frozen-lockfile`; adding `--prefer-offline`
makes installs prefer the (already-cached) pnpm store over the network, trimming
a few seconds per job across ~18 jobs.

## Acceptance criteria

- [ ] Every job that runs `pnpm install` uses `uses: ./.github/actions/setup-pnpm`
      instead of inlining `pnpm/action-setup` + `actions/setup-node`. Jobs that
      need Ruby still add `ruby/setup-ruby` separately; the `prettier` job
      (which deliberately skips `pnpm install` and runs `npx prettier`) is left
      as-is.
- [ ] `pnpm install --frozen-lockfile` becomes
      `pnpm install --frozen-lockfile --prefer-offline` everywhere.
- [ ] The pnpm version pin (`11.5.1`) and Node version (`24`) are sourced from
      the composite defaults — no per-job version literals remain.
- [ ] CI green on a push to `main` (full matrix) — confirm no job lost its pnpm
      cache (check the setup-node cache-hit logs).

## Savings & risk

- **Expected wall-time impact: ENABLER (marginal alone).** Shaves only a few
  seconds of install per job and is not itself a critical-path win. Its purpose
  is to give `cache-build-dist-across-jobs` one consistent setup path — so it
  merges **bundled with / ahead of** that MOVER and is **closed with it** if
  that story fails its gate. It must not regress wall time (the go/no-go check
  below is "no regression," not "improvement").
- **Est. savings:** ~0.5–1 billed job-min/run (install shaved a few seconds
  across ~18 jobs; mostly sub-rounding but compounds with cancellation/rerun
  volume). Primary value is **foundational + WAN-safety**, not raw minutes.
- **Risk:** low. Pure setup-step substitution; the composite already encodes
  the hosted path identically to the inlined steps.

## Measurement & go/no-go

As an ENABLER this is judged on its dependent, not a standalone win (see the
RFC's "Measurement protocol").

- [ ] Confirm **no wall-time regression**: median time-to-green over ≥5 runs is
      within noise of `main` (every job still gets a pnpm cache hit — check the
      setup-node cache logs).
- [ ] **Go:** no regression **and** `cache-build-dist-across-jobs` clears its
      own gate (ship them together or this first, that immediately after).
      **No-go:** if `cache-build-dist-across-jobs` is closed for no gain, close
      this too — there is no independent justification to keep it.
- [ ] PR description includes the time-to-green table and per-job cache-hit
      confirmation.

## Notes

The composite's self-hosted branch keys on `runner.environment != 'github-hosted'`.
`vars.RUNNER` is currently unset so everything resolves hosted today; routing
all jobs through the composite is also what would make the self-hosted lever
usable if it is ever revisited (the runner-sizing dimension was rejected for
now — see the RFC's "Rejected dimensions").
