---
title: "vendor/sources: every compareTests: false carries a testsExcludedReason, shown on the package page"
status: in-progress
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: pairing
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9864
claim: "2026-11-08T12:59:54Z"
assignee: "sources-tests-excluded-reason"
blocked-by: null
---

## Context

`vendor/sources.ts:63` declares `apiExcludedReason`, and `validateSources`
(`vendor/sources.ts:1044`) refuses a `compareApi: false` entry that has none.
`scripts/parity/package-summary.ts` (`apiExcludedReasonOf`, `withExclusion`)
appends that reason to the package description, so trailmap says why an api
tile is missing. `compareTests: false` (`vendor/sources.ts:75`) has no such
field. image_processing (`:494`), rails-dom-testing (`:636`), nokogiri (`:653`),
racc (`:671`), rails-html-sanitizer (`:687`), loofah (`:702`), crass (`:717`),
solid-cache (`:852`) and tzinfo (`:868`) turn their tests tile off silently.

## Acceptance criteria

- [ ] `UpstreamPackage` gains `testsExcludedReason?: string`. `validateSources`
      refuses `compareTests: false` without one, and `vendor/sources.test.ts`
      covers the refusal.
- [ ] Every current `compareTests: false` entry gets a reason that names the
      story enrolling it: this RFC's enrollment stories, or 0196's
      `solid-cache-package-skeleton` for solid-cache.
- [ ] `package-summary.ts` appends the reason to the description as
      `(Not in parity:test: …)`, alongside the api one, with a test in
      `package-summary.test.ts`.
