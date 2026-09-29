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
"activejob"`, because `vendor/sources.ts` has no activejob entry under the
`rails` source (`:107-149` lists activemodel, activesupport, actionpack,
actionview and trailties). Measured over the vendored tree, the extractors
report `activejob: 39 classes, 29 modules, 247 public methods (72 internal)`
and `416 tests across 22 files`.

Registrations (RFC "Tooling enrollment";
`project_test_compare_enrollment_needs_four_registrations`):

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
4. A sorted `0/0/0` `activejob` row in
   `scripts/test-compare/assertion-mismatch-mark.json`, hand-added. **Do not
   reseed**: a reseed moves every package's counters.
5. `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`: add
   `packages/activejob` to the `rails-private-jsdoc` enrollment, in sync, and
   mirror any `ignores` (`project_rails_private_jsdoc_config_ignores_must_mirror_root`).
   Per RFC Open question 2, run the autofix here.

**The non-ports.** Add `scripts/parity/unported-files/activejob.ts`
(`ACTIVEJOB_UNPORTED_FILES`, spread into `index.ts` beside
`GLOBALID_UNPORTED_FILES`) with `package: "activejob"` entries:

- `pattern` for each of `queue_adapters/backburner_adapter.rb`,
  `delayed_job_adapter.rb`, `queue_classic_adapter.rb`, `resque_adapter.rb`,
  `sidekiq_adapter.rb`, `sneakers_adapter.rb` and `sucker_punch_adapter.rb`
  (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/`, 389 lines,
  29 public methods);
- `testFile: "cases/delayed_job_adapter_test.rb"` (3 cases) and
  `testFile: "integration/queuing_test.rb"` (15 cases, driven by
  `test/support/integration/adapters/*.rb`);
- a per-test entry for `cases/adapter_test.rb` naming its two
  `if adapter_is?(:sucker_punch)` cases (`:10-35`). The file's first case,
  `"should load #{ENV['AJ_ADAPTER']} adapter"`, is ported.

The `reason` is the RFC's Non-goals wording: each adapter is a shim over a Ruby
gem's client with no Node counterpart, and a real backend is its own RFC over
an npm client, async from its first PR. Do not use `SKIP_GROUPS`, which is
member-level.

## Acceptance criteria

- [ ] `pnpm parity:api --package activejob` prints a row, with the seven
      adapter files reported as unported rather than missing.
- [ ] `pnpm parity:test` prints an activejob block with 396 counted cases.
      The 20 gem-adapter cases are excluded.
- [ ] `pnpm parity:test:assertions` is green with the hand-added row, and no
      other package's row changes.
- [ ] The `rails-private-jsdoc` enrollment lists `packages/activejob` in both
      configs.
- [ ] `vendor/sources.test.ts` is green.
