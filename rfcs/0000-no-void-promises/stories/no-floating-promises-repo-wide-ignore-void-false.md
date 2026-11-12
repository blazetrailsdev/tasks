---
title: "no-floating-promises runs repo-wide with ignoreVoid false, against an only-shrink mark"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`eslint.config.mjs:1233-1241` enables `@typescript-eslint/no-floating-promises`
for `activemodel/lib`, `activerecord/src` and `scripts` only, with the default
`ignoreVoid: true`. Run over every package it reports 19 bare floating promises
(RFC § Motivation) and accepts ~57 `void <promise>` statements. The prefilter
in `eslint/promise-rule-prefilters.mjs` must keep working at the wider scope.

## Acceptance criteria

- [ ] The rule runs on `packages/**` (lib, src and tests) and `scripts/**`, with `ignoreVoid: false`.
- [ ] Existing findings are recorded as a per-package count mark that is only-shrink with no reseed, documented in `docs/parity-gates.md`.
- [ ] A new finding in any file reds CI.
- [ ] No receipt tag or eslint-disable comment is introduced to exempt a site.

## Definition of done

Raising a mark, or adding an `eslint-disable` for this rule, does not close this story.
