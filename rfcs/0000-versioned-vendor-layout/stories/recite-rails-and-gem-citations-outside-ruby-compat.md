---
title: "Recite rails and gem citations outside ruby-compat"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
  - activesupport
  - rack
  - rack-session
  - rack-test
deps: [vendor-recite-rewrites-citations-to-the-active-version]
deps-rfc: []
est-loc: 260
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The non-MRI half: 136 `vendor/rails/`, 14 `rack`, 10 `rack-test`, 8
`rack-session`, 5 `i18n`, 4 `date`, 4 `globalid`, 2 `did_you_mean` occurrences.
Concentrated in `scripts/api-compare/` (notably `ar-closure.ts` and its test, 13
between them), `scripts/test-compare/`, `scripts/schema-compare/compare.ts`,
`scripts/parity/conventions.ts`, `scripts/build-rails-error-manifest.ts`,
`packages/activesupport/src`, `packages/rack-test/src`, `docs/`, plus trails'
`CLAUDE.md` (7) and `CONTRIBUTING.md` (3).

`scripts/rails-find/core.ts` holds 24 and is deliberately **excluded** here: its
citations are output strings, handled by `rails-find-prints-versioned-paths`.

## Acceptance criteria

- Every tracked `vendor/<source>/…` citation outside `packages/ruby-compat/` and
  `scripts/rails-find/` names the active version.
- `CLAUDE.md` and `CONTRIBUTING.md` citations are swept too, and CLAUDE.md gains
  one sentence stating that a vendor citation names the version it was verified
  against.
- The diff is `pnpm vendor:recite` output plus any hand fix it could not make,
  each listed in the PR body.
- Tests asserting on a `vendor/...` path string (e.g. `scripts/api-compare/ar-closure.test.ts`)
  pass without a name change.
- `pnpm parity:api` / `parity:test` deltas are zero.
