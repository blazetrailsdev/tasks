---
title: "rails-error-parity: flag manifest error classes whose home file is entirely unported"
status: draft
updated: 2026-06-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `rails-error-parity` ESLint rule (`eslint/rails-error-parity.mjs`) checks,
for every in-scope file, that the manifest error classes mapped to it are
exported with the correct parent. The check is file-driven: it only runs when
ESLint visits an in-scope source file. If a manifest error class maps to a TS
file that **does not exist yet** (the feature is unported), the rule never runs
for that path and the missing class passes silently — no `missingClass` is
emitted because there is no file to lint.

An audit during #3375 (scattered-error-file parity) found ~10 such classes
whose Rails home file is entirely absent in the port, e.g.:

- `FixtureError`, `FormatError` (`active_record/fixtures.rb`)
- `PrimaryKeyError` (`active_record/fixture_set/table_row.rb`)
- `DestroyAssociationAsyncError` (`active_record/destroy_association_async_job.rb`)
- `DeprecationException` (`active_support/deprecation/behaviors.rb`)
- `DisallowedType` (`active_support/core_ext/hash/conversions.rb`)
- `InvalidContentError`, `InvalidKeyError` (`active_support/encrypted_configuration.rb`)
- `ParsingError` (`active_support/duration/iso8601_parser.rb`)
- `SoleItemExpectedError` (`active_support/core_ext/enumerable.rb`)

These are genuine parity gaps (the error class is observable API) but the
ratchet cannot see them. They mostly track unported subsystems (encryption,
message_pack, fixtures), so this is a tracking/visibility gap, not necessarily
a request to port the features now.

## Acceptance criteria

- A file-independent check (extend `manifest-complete.test.mjs` or add a sibling
  test/lint) asserts that every manifest error class either (a) has a matching
  exported class in its mapped home file, or (b) is listed in an explicit
  "unported" allowlist with a reason. Silent absence is no longer possible.
- The ~10 currently-unported classes are seeded into that allowlist so the
  check passes at introduction (ratchet-style, list only shrinks).
- The check respects the snake_case→kebab-case path mapping already in
  `rubyToSrcRel` and the existing scope/exclude semantics.

## Notes

- No node:\* imports, async fs only, no new runtime deps (matches existing
  eslint-tooling constraints).
- Manifest source: `pnpm tsx scripts/build-rails-error-manifest.ts`.
