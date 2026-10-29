---
title: "Port mini_mime with its vendored type DB"
status: in-progress
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mini-mime"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9451
claim: "2026-10-29T19:45:38Z"
assignee: "mini-mime-port"
blocked-by: null
---

## Context

`mini_mime` 1.1.5 answers `lookup_by_filename`, `lookup_by_extension` and
`lookup_by_content_type` over two flat files (`lib/db/ext_mime.db`,
`content_type_mime.db`) with a binary search and an LRU cache. `mail` calls it
from `attachments_list.rb` and `part.rb`.

## Acceptance criteria

- `packages/mini-mime` ports `MiniMime`, `Info` and `Db` at their Ruby names, reading
  the vendored DB files.
- The gem's tests pass; `parity:api` and `parity:test` report the package.
- Parity enrolment, first PR to create `packages/mini-mime/src` (each miss reds a
  different CI job):
  1. `vendor/sources.ts`: give the `mini_mime` source its `packages` entry
     (`libPath`, `testPath: "test"`, `compareApi` / `compareTests`), and
     update `vendor/sources.test.ts`'s exact lists for `apiComparePackages()`,
     `testPathsManifest()` and `libEntryFilesManifest()`.
  2. `scripts/test-compare/extract-ts-tests.ts` `packages` array.
  3. `scripts/test-compare/compare.ts` `pkgDirs` in `extractRelativeTsPath`
     (widen the `spec_` branch for RSpec-named files where needed).
  4. `scripts/api-compare/config.ts` `MANIFEST_PACKAGES`.
  5. `ENROLLED_PACKAGES` in `scripts/api-compare/lint-ruby-compat-calls.ts`.
  6. A `0/0/0` row in `scripts/test-compare/assertion-mismatch-mark.json`,
     added by hand in sorted position (never `parity:test:assertions:reseed`).
  7. New-package registrations: `pnpm-workspace.yaml`, root `tsconfig.json`,
     both `vitest.config.ts` aliases, and `.github/workflows/ci.yml` (the
     package-family regex, the lane's `vitest run` step, the non-AR coverage
     list; update `scripts/ci-suite-coverage.test.ts`'s literal fixtures if
     the lane line changes).
  8. Run `pnpm parity:test:assertions` and `pnpm vitest run scripts/ vendor/`
     before opening the PR.
