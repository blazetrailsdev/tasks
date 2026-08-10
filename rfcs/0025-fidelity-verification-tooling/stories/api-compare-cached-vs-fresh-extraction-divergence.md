---
title: "parity:api cached manifests diverge from a forced fresh extraction"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5375
claim: "2026-07-26T23:42:55Z"
assignee: "api-compare-cached-vs-fresh-extraction-divergence"
blocked-by: null
closed-reason: null
---

## Context

While verifying PR #5345's successor (#5370, `TS_ALWAYS_ALLOWED` dissolution) the
same working tree produced two different `extra-surface` reports depending on
whether `pnpm parity:api` reused its shared cache or ran under
`API_COMPARE_FORCE=1`. With no source change between runs, a forced fresh
extraction added four "moved" extras that the cached manifests did not have:

- `actionview helpers/output-safety-helper.ts h`
- `actionview helpers/output-safety-helper.ts htmlEscapeOnce`
- `trailties generators/base.ts tableize`
- `trailties generators/base.ts underscore`

Each is reproducible: two consecutive `API_COMPARE_FORCE=1` runs agree with each
other, and the cached-manifest runs agree with each other, but the two
populations differ. All four names arrive via cross-package module resolution
(activesupport core-ext modules included into an actionview helper / a trailties
generator), which points at the include/module map being cached at a coarser
grain than the inputs it depends on — the same class of bug as the (done)
`api-compare-cache-key-extractor-schema-version` and
`api-compare-shared-cache-eviction` stories, one layer up.

This matters because it makes any before/after extra-surface measurement
untrustworthy unless the baseline is re-extracted with `API_COMPARE_FORCE=1`
(which is what #5370 ended up doing).

## Acceptance criteria

- Root-cause which cache layer drops or stales the cross-package module
  contributions for those four names.
- A cached `pnpm parity:api` run and an `API_COMPARE_FORCE=1` run produce
  byte-identical `output/{rails-api.json,ts-api.json}` for an unchanged tree
  (or the cache key is widened until they do).
- Regression test in `scripts/api-compare/shared-cache.test.ts` pinning the
  invariant.
