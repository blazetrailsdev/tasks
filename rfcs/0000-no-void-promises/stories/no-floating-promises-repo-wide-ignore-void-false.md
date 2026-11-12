---
title: "no-floating-promises runs repo-wide with ignoreVoid false, against an only-shrink mark"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 1 and § 5. `eslint.config.mjs:1233-1241` enables
`@typescript-eslint/no-floating-promises` for `activemodel/lib`,
`activerecord/src` and `scripts` only (RFC 0063), with the default
`ignoreVoid: true`. Run over every package's `lib/` and `src/` on 2026-11-12 it
reported 19 findings; with `ignoreVoid: false` and tests included the regex
estimate is ~555 (RFC § Motivation). The prefilter in
`eslint/promise-rule-prefilters.mjs` and its test must keep working at the
wider scope, and the lint job's heap (`package.json` `lint`, 10240 MB) must
hold.

## Acceptance criteria

- [ ] The rule runs on `packages/**` (sources and tests) and `scripts/**` with `ignoreVoid: false`; every package is covered by the type-aware `projectService` block.
- [ ] Findings are recorded as a per-package count mark, only-shrink with no reseed, with a `:tighten` command, documented in trails `docs/parity-gates.md`.
- [ ] A finding above a package's mark reds CI; the PR body states the exact seeded counts, which replace the RFC's regex estimate.
- [ ] The RFC 0063 comment block in `eslint.config.mjs` is updated to describe the wider scope.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
