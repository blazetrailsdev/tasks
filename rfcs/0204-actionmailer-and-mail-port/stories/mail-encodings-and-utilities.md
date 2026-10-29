---
title: "Port Mail::Encodings, encodings/ and Mail::Utilities"
status: in-progress
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9452
claim: "2026-10-29T19:46:24Z"
assignee: "mail-encodings-and-utilities"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/encodings.rb` (314: RFC 2047 `b_value_encode` / `q_value_encode`,
`value_decode`), `encodings/` (262: base64, quoted-printable, 7bit, 8bit,
binary, `UnixToUnix`) and `utilities.rb` (562). Strings follow CLAUDE.md "Ruby
Strings are JS string primitives"; non-UTF-8 charsets transcode with npm
`iconv-lite` where Ruby calls `String#encode`.

## Acceptance criteria

- Ported at their Ruby names; `encodings_spec.rb`, `encodings/*_spec.rb` and
  `utilities_spec.rb` pass.
- Parity enrolment, first PR to create `packages/mail/src` (each miss reds a
  different CI job):
  1. `vendor/sources.ts`: give the `mail` source its `packages` entry
     (`libPath`, `testPath: "spec"`, `compareApi` / `compareTests`), and
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
