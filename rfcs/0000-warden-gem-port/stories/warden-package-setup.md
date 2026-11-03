---
title: "Vendor warden 1.2.9 and create @blazetrails/warden, registered and parity-enrolled"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-setup
packages: ["warden"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Root story of the RFC (Design §1). Nothing in the tree vendors warden and no
package is named for it (`grep -rli warden packages scripts vendor/sources.ts`
finds nothing). The precedent is RFC 0137's four setup stories, done here as
one: `vendor-rack-test-source`, `rack-test-package-skeleton`,
`enroll-rack-test-in-compare-tooling`, `register-rack-test-in-ci-lanes`. Read
their bodies for the exact registration points; the line numbers below are as
of 2026-11-03.

- **Vendor entry.** `vendor/sources.ts:220-246` (rack-test) is the shape: a
  source `warden`, `url: "https://github.com/wardencommunity/warden.git"`,
  `ref: "v1.2.9"`, one package `{ name: "warden", libPath: "lib/warden",
libEntryFile: "lib/warden.rb", testPath: "spec" }`, comparison on. The
  comment cannot cite `vendor/rails/v8.0.2/Gemfile.lock` (warden is not in it);
  it cites this RFC and RFC Open question 1. Regenerate
  `vendor/sources.lock.json` with `pnpm vendor:fetch`.
- **Package.** `packages/rack-test/package.json` is the template: `"name":
"@blazetrails/warden"`, published (no `private`), depending on
  `@blazetrails/rack` and `@blazetrails/ruby-compat` (warden.gemspec declares
  `rack >= 2.2.3` only; `require 'forwardable'` at `lib/warden.rb:4` is
  stdlib with no ruby-compat file, see RFC Design §3). Root `tsconfig.json`
  reference; both `vitest.config.ts` alias entries, subpath above bare.
- **One real port**, so `index.ts` is not empty: `src/version.ts` for
  `lib/warden/version.rb:1-5` (`VERSION = "1.2.9"`), modelled on
  `packages/rack/src/version.ts`.
- **Compare tooling.** `scripts/api-compare/config.ts` `MANIFEST_PACKAGES`;
  `scripts/test-compare/compare.ts` `pkgDirs` and `rubyToConventionTs`;
  `scripts/test-compare/generate-stubs.ts`; `scripts/test-compare/extract-ts-tests.ts`.
  The mapping arm strips `warden/` and maps `_spec.rb` to `.test.ts`
  (`spec/warden/strategies/base_spec.rb` to `strategies/base.test.ts`).
  `spec/warden/scoped_session_serializer.rb` has no `_spec` suffix (rspec's
  default pattern skips it, `.rspec` sets none); map it to
  `scoped-session-serializer.test.ts` if the Ruby extractor lists it.
- **CI.** `.github/workflows/ci.yml`: `RACK_PKGS_RE` gains `warden`, the
  "Rack tests" step gains `packages/warden`, the non-AR coverage list gains it;
  `scripts/ci-suite-coverage.test.ts` stays green.
- **Constants.** `packages/warden/src/constants.generated.ts`, generated the
  way `packages/rack-test/src/constants.generated.ts` is.

## Acceptance criteria

- `pnpm vendor:fetch` populates `vendor/warden/v1.2.9/{lib,spec}`; the source
  comment names this RFC as the pin's authority.
- `packages/warden` builds; a plain-node import of the built
  `packages/warden/dist/index.js` succeeds.
- `pnpm parity:api` and `pnpm parity:test` list `warden` (0 ported is the
  honest day-one number).
- A change under `packages/warden/` triggers the Rack lane, and the lane runs
  its tests.
