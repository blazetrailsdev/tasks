---
title: "CI typechecks every examples/* app on a packages/ change"
status: claimed
updated: 2026-11-28
rfc: "0260-parity-gates-catch-semantic-drift"
cluster: parity-gates
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-28T16:49:52Z"
assignee: "delegate-missing-to-in-ruby-manifest"
blocked-by: null
closed-reason: null
---

## Context

RFC Design §5. Every type-only fix in trails#10792 (actionview exports,
`ConstantTable`, `Loofah` constants, `CustomUrlHelperHost#routeFor`, trails-tsc
view scope, activerecord-cli writer types) was found by the Writebook app's
`pnpm typecheck`, not by any framework test. `.github/workflows/ci.yml` builds
only `examples/homepage` and boots `examples/browser-sqlite`.

## Acceptance criteria

- [ ] A CI job runs `pnpm typecheck` in each `examples/*` app with a `typecheck` script, triggered by changes under `packages/` or `examples/`.
- [ ] The job is green on `main` at landing; an app that is red at landing is fixed or left out with its reason in the job.
- [ ] `docs/parity-gates.md` (or CONTRIBUTING) names the job.
