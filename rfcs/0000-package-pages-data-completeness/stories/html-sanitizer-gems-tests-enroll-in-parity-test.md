---
title: "parity:test: enroll rails-html-sanitizer, loofah and crass tests under html-sanitizer"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: test-enrollment
packages: ["html-sanitizer", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:676-717` vendors rails-html-sanitizer v1.6.2, loofah
v2.24.0 and crass v1.0.6, all ported by `html-sanitizer`
(`PACKAGE_DIR_OVERRIDES`, `scripts/api-compare/config.ts:52-54`) and all
`compareTests: false`. The Ruby tests are rails-html-sanitizer
`test/{rails_api,sanitizer,scrubbers}_test.rb`, 14 loofah files and 8 crass
files. `packages/html-sanitizer/test/` already has `rails-api.test.ts`,
`full-sanitizer.test.ts`, `safe-list-sanitizer.test.ts`, and `loofah/` and
`crass/` subtrees. The package has an api tile (trails#9825) but no tests tile.

## Acceptance criteria

- [ ] All three gems have a `testPath` and `compareTests: true`, and are
      registered in `scripts/test-compare/`. Their rows roll up under
      `html-sanitizer`'s compare keys.
- [ ] A Ruby test file with no TS counterpart is an `unported-files` row.
- [ ] `pnpm parity:test` reports all three keys. Every other package's delta is
      zero.
