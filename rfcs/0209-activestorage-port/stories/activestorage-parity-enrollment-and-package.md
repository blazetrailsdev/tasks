---
title: "Create packages/activestorage and enroll it in parity:api and parity:test"
status: in-progress
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-infra
packages: ["activestorage"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9444
claim: "2026-10-29T16:17:59Z"
assignee: "activestorage-parity-enrollment-and-package"
blocked-by: null
closed-reason: null
---

## Context

ActiveStorage lives in the `rails` vendor source (`vendor/rails/v8.0.2/activestorage`), which
`vendor/sources.ts` does not list as a package. `packages/solid-queue` is the
precedent for an engine with `app/` code: its entry
(`vendor/sources.ts:744-753`) sets `libPath`, `libEntryFile`, `testPath` and
`extraLibPaths: ["app/models/solid_queue", "app/jobs/solid_queue"]`. The RFC's
Design section, "Package layout and parity", gives activestorage's four
`extraLibPaths`.

Enrolling touches every registry that enumerates packages by hand:
`vendor/sources.test.ts` (`apiComparePackages()`, `testPathsManifest()`,
`libEntryFilesManifest()`), `scripts/test-compare/extract-ts-tests.ts`
`packages`, `scripts/test-compare/compare.ts` `pkgDirs`,
`scripts/api-compare/config.ts` `MANIFEST_PACKAGES`, `ENROLLED_PACKAGES` in
`scripts/api-compare/lint-ruby-compat-calls.ts`, and a `0/0/0` row added by
hand to `scripts/test-compare/assertion-mismatch-mark.json`. A new package
also needs `ci.yml`, workspace and tsconfig references and a guard fixture.

## Acceptance criteria

- `packages/activestorage` exists as a published workspace package depending
  on activesupport, actionpack, activejob, activerecord and marcel, as
  `activestorage.gemspec` does, with `version.ts` / `gem-version.ts` ported
  from `lib/active_storage/{version,gem_version}.rb` as its first content.
- `vendor/sources.ts` has the `activestorage` package entry with
  `compareApi: true` and `compareTests: true`, and every registry listed above
  names it; `pnpm vitest run scripts/ vendor/` and `pnpm parity:test:assertions`
  pass.
- `service/{s3,gcs,azure_storage}_service.rb` and their tests, and
  `test/javascript_package_test.rb`, are permanent unported rows citing the
  RFC's non-goals.
- CI runs the package's tests on all three adapter lanes.
