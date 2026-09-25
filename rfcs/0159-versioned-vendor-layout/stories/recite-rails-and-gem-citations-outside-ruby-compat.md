---
title: "Recite rails and gem citations outside ruby-compat"
status: ready
updated: 2026-09-25
rfc: "0159-versioned-vendor-layout"
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

`scripts/rails-find/core.ts`'s 27 occurrences are **not** in scope: they are
path _construction_, converged onto the registry by
`route-vendor-path-construction-through-sources-ts`, so they carry the version
automatically. Same for the other constructions that story fixes. The lint and
fixture files on the codemod's exclusion list
(`eslint/ruby-compat-needs-mri-citation.mjs`,
`scripts/api-compare/jsdoc-tag-line.test.ts`) are out of scope too — they are
handled by `version-the-mri-citation-lint-and-its-resolver`.

## Acceptance criteria

- Every tracked `vendor/<source>/…` citation outside `packages/ruby-compat/` and
  `scripts/rails-find/` names the active version.
- `CLAUDE.md` and `CONTRIBUTING.md` citations are swept too, and CLAUDE.md gains
  one sentence stating that a vendor citation names the version it was verified
  against.
- The diff is `pnpm vendor:recite` output plus any hand fix it could not make,
  each listed in the PR body.
- The `.prettierignore` comments at `:27,30` that cite the copied Rails fixture
  files are swept too, and `scripts/db-init/{mysql,postgres}/*.sql`'s Rakefile
  citations.
- Tests asserting on a `vendor/...` path string pass without a name change (the
  fixtures in `ar-closure.test.ts` and friends were already moved by the layout
  story).
- `pnpm parity:api` / `parity:test` deltas are zero.
