---
title: "Enroll activejob in parity:api and parity:test, and record the gem adapters as unported"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["activejob-package-skeleton"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Today `pnpm parity:api --package activejob` fails with `unknown package
"activejob"`: `vendor/sources.ts` has no activejob entry under the `rails`
source (`:107-149`). Measured over the vendored tree, the extractors report
`activejob: 39 classes, 29 modules, 247 public methods (72 internal)` and
`416 tests across 22 files`.

Registrations (RFC "Tooling enrollment"). `pnpm parity:test` passes without
number 4, so a green local compare does not prove it:

1. `vendor/sources.ts`: `{ name: "activejob", libPath:
"activejob/lib/active_job", testPath: "activejob/test" }`, plus
   `vendor/sources.test.ts`, which asserts the exact key lists of
   `apiComparePackages()` and `testPathsManifest()`.
2. `MANIFEST_PACKAGES` in `scripts/api-compare/config.ts`.
3. `scripts/test-compare/extract-ts-tests.ts` (`getPackageTestFiles()`),
   `scripts/test-compare/compare.ts` `pkgDirs`, and
   `scripts/test-compare/generate-stubs.ts`. Check that `rubyToConventionTs`
   maps `cases/queue_naming_test.rb` → `queue-naming.test.ts` and
   `serializers/time_with_zone_serializer_test.rb` →
   `serializers/time-with-zone-serializer.test.ts` before adding a package arm.
4. A sorted, hand-added `0/0/0` `activejob` row in
   `scripts/test-compare/assertion-mismatch-mark.json`. Do not reseed.
5. `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`: add
   `packages/activejob` to the `rails-private-jsdoc` enrollment in both, and
   mirror the root config's `ignores` into the second. Run the autofix here
   (RFC Open question 2).

**The non-ports.** Add `scripts/parity/unported-files/activejob.ts`
(`ACTIVEJOB_UNPORTED_FILES`, spread into `index.ts` beside
`GLOBALID_UNPORTED_FILES`) with `package: "activejob"` entries:

- `pattern` for each of `queue_adapters/backburner_adapter.rb`,
  `delayed_job_adapter.rb`, `queue_classic_adapter.rb`, `resque_adapter.rb`,
  `sidekiq_adapter.rb`, `sneakers_adapter.rb` and `sucker_punch_adapter.rb`
  (389 lines, 29 public methods);
- `testFile: "cases/delayed_job_adapter_test.rb"` (3 cases) and
  `testFile: "integration/queuing_test.rb"` (15 cases, driven by
  `test/support/integration/adapters/*.rb`);
- a per-test entry for `cases/adapter_test.rb` naming its two
  `if adapter_is?(:sucker_punch)` cases (`:10-35`).

Each `reason` is the RFC's Non-goals wording. `SKIP_GROUPS` is member-level and
is not used.

## Acceptance criteria

- [ ] `pnpm parity:api --package activejob` prints a row, with the seven adapter files reported as unported rather than missing.
- [ ] `pnpm parity:test` prints an activejob block counting 396 cases; the 20 gem-adapter cases are excluded. (The Zeitwerk entry that brings the RFC's total to 395 is added by `port-activejob-test-helper-test-enqueued-part-2`.)
- [ ] `pnpm parity:test:assertions` is green with the hand-added row, and no other package's row changes.
- [ ] Both `rails-private-jsdoc` configs list `packages/activejob`, and `vendor/sources.test.ts` is green.

## Definition of done

Running `parity:test:assertions:reseed`, or a `SKIP_GROUPS` entry for an adapter's methods, does not close this story.
