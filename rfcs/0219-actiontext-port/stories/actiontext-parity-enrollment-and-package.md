---
title: "Create packages/actiontext and enroll it in parity:api and parity:test"
status: ready
updated: 2026-11-07
rfc: "0219-actiontext-port"
cluster: at-infra
packages: ["actiontext"]
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

ActionText lives in the `rails` vendor source (`vendor/rails/v8.0.2/actiontext`), which `vendor/sources.ts`
does not list as a package. `activestorage-parity-enrollment-and-package`
(RFC 0209, trails#9444) is the precedent: a `vendor/sources.ts` entry with
`libPath`, `libEntryFile`, `testPath` and `extraLibPaths`, plus every registry
that enumerates packages by hand (`vendor/sources.test.ts`,
`scripts/test-compare/extract-ts-tests.ts`, `scripts/test-compare/compare.ts`
`pkgDirs`, `scripts/api-compare/config.ts` `MANIFEST_PACKAGES`,
`ENROLLED_PACKAGES` in `scripts/api-compare/lint-ruby-compat-calls.ts`, a
hand-added row in `scripts/test-compare/assertion-mismatch-mark.json`), and
`ci.yml`, workspace, tsconfig references and a guard fixture.

`vendor/rails/v8.0.2/actiontext/actiontext.gemspec` depends on activesupport, activerecord,
activestorage, actionpack and nokogiri (plus globalid through activerecord).
`lib/action_text/version.rb` (12), `gem_version.rb` (19) and `deprecator.rb`
(9) are the leaf files.

## Acceptance criteria

- `packages/actiontext` exists as a published workspace package depending on
  activesupport, activerecord, activestorage, actionpack, actionview,
  nokogiri, html-sanitizer and globalid, with `version.ts`,
  `gem-version.ts` and `deprecator.ts` ported from the three leaf files.
- `vendor/sources.ts` has the entry from the RFC's "Package layout and
  parity" (`extraLibPaths` for `app/models/action_text` and
  `app/helpers/action_text`) with `compareApi` and `compareTests` on, and
  every registry above names it.
- `app/javascript/**`, `app/assets/**` and `test/javascript_package_test.rb`
  are permanent unported rows citing the RFC's non-goals.
- CI runs the package's tests on all three adapter lanes.
