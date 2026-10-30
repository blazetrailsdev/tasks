---
title: "Port Net::SMTP's client surface over nodemailer's SMTPConnection"
status: claimed
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-delivery
packages: ["net-smtp"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-10-30T03:26:36Z"
assignee: "net-smtp-port"
blocked-by: null
---

## Context

`vendor/net-smtp/v0.5.1/lib/net/smtp.rb` is the Ruby SMTP client.
`mail`'s `network/delivery_methods/smtp.rb` and `smtp_connection.rb` call
`Net::SMTP.new`, `enable_starttls` / `enable_starttls_auto` /
`enable_tls`, `open_timeout=` / `read_timeout=`, `start`, `finish` and
`sendmail`. The wire protocol is nodemailer's
`nodemailer/lib/smtp-connection`, never `createTransport`.

## Acceptance criteria

- `packages/net-smtp` ports `Net::SMTP` and its error classes
  (`SMTPAuthenticationError`, `SMTPServerBusy`, …) at their Ruby names;
  members whose body is the wire protocol delegate to `SMTPConnection`, each
  carrying a receipt citing the RFC's "Transport edges". The unported remainder
  is a `SCOPED_SKIP_GROUPS` entry with the same citation.
- `start` / `sendmail` / `finish` are `async`.
- The gem's tests for the ported surface pass against npm `smtp-server`.
- Parity enrolment, first PR to create `packages/net-smtp/src` (each miss reds a
  different CI job):
  1. `vendor/sources.ts`: give the `net-smtp` source its `packages` entry
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
