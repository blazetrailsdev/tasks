---
title: "api:extra does not check rails-api.json for staleness, only ts-api.json"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

Found while adding the manifest-staleness guard in #5421.

`manifestIsStale()` (`scripts/api-compare/build-freshness.ts`), wired into
`scripts/api-compare/extra-surface.ts`, checks only `output/ts-api.json` against
the TypeScript sources. The Ruby-side manifest `output/rails-api.json` has no
equivalent check.

`api:extra` computes extra surface by diffing the TS manifest against the Ruby
one, so a stale `rails-api.json` moves the totals just as a stale `ts-api.json`
does — it changes the "allowed" name set every TS name is checked against. It
goes stale on a different trigger: `vendor/sources.lock.json` re-pinning, or
`pnpm vendor:fetch` pulling new upstream Ruby, without re-running the Ruby
extraction step.

The asymmetry is not principled — it is just where #5421 stopped. Its scope was
the TS build/checkout axis.

Trails file:line: `scripts/api-compare/build-freshness.ts` (`manifestIsStale`),
`scripts/api-compare/extra-surface.ts` (the guard call site, just before both
manifests are read), `.github/workflows/ci.yml` (the "Extract Ruby API" step).

No Rails equivalent — this is api-compare infrastructure, not mirrored Rails
behaviour.

## Acceptance criteria

- `api:extra` fails loudly when `output/rails-api.json` is older than the
  vendored Ruby sources or the lockfile that pins them, the way it already does
  for `output/ts-api.json` versus `packages/*/src`.
- Pick an oracle that does not false-positive the way the first TS-side attempt
  did: `vendor/*/` is a gitignored clone restored from an `actions/cache`
  tarball with archive mtimes, so a naive newest-mtime comparison will misfire in
  CI exactly as it did in #5421.
- Honour `API_COMPARE_ALLOW_STALE_BUILD=1`, consistent with the existing guards.
- Regression test covering a stale `rails-api.json` and the CI cache-restore
  state that must NOT fire.
