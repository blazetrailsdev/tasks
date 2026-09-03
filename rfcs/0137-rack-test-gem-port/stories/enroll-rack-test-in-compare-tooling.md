---
title: "Enroll rack-test in parity:api and parity:test"
status: done
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["rack-test-package-skeleton"]
deps-rfc: []
est-loc: 250
priority: 3
pr: 7459
claim: "2026-09-03T20:37:20Z"
assignee: "enroll-rack-test-in-compare-tooling"
blocked-by: null
closed-reason: null
---

## Context

Story 3 of the RFC. With the source vendored and the package created, register
rack-test at every point `rack-session` is registered today. `PACKAGES` is
derived from `vendor/sources.ts` by `apiComparePackages()`
(`scripts/api-compare/config.ts:15`), so the source entry already enrolls it
there; the rest are explicit lists:

- `scripts/api-compare/config.ts:190` — `MANIFEST_PACKAGES` gains `"rack-test"`.
- `scripts/test-compare/compare.ts:1493` — `pkgDirs` gains
  `"rack-test": "packages/rack-test/src/"`.
- `scripts/test-compare/generate-stubs.ts:31` — the same entry. RFC 0133 shipped
  this half late and had to file
  `add-rack-session-to-generate-stubs-pkg-dirs` (**status `done`**) to catch up;
  land both lists in one PR here.
- `scripts/test-compare/extract-ts-tests.ts:20` — the package list.
- `scripts/test-compare/compare.ts:128-140` — `rubyToConventionTs` gains a
  `rack-test` arm.

The mapping arm is the only non-mechanical part. The Ruby extractor reports
paths relative to `testPath: "spec"`, so every file carries a leading `rack/`:
`rack/test_spec.rb`, `rack/test/cookie_jar_spec.rb`, etc. Strip `rack/`, then
strip the redundant leading `test/` directory segment — the same
repeated-lib-root case the existing i18n and rack-session arms handle — and map
`_spec.rb` → `.test.ts`:

| Ruby                              | TS                      |
| --------------------------------- | ----------------------- |
| `rack/test_spec.rb`               | `test.test.ts`          |
| `rack/test/cookie_jar_spec.rb`    | `cookie-jar.test.ts`    |
| `rack/test/cookie_spec.rb`        | `cookie.test.ts`        |
| `rack/test/cookie_object_spec.rb` | `cookie-object.test.ts` |
| `rack/test/methods_spec.rb`       | `methods.test.ts`       |
| `rack/test/multipart_spec.rb`     | `multipart.test.ts`     |
| `rack/test/uploaded_file_spec.rb` | `uploaded-file.test.ts` |
| `rack/test/utils_spec.rb`         | `utils.test.ts`         |

Note the existing arm strips a `spec_` PREFIX (`rack`'s `spec_mock_request.rb`);
rack-test uses a `_spec` SUFFIX, so this is a new branch, not a widened one.

Day-one baseline, which is the honest number and not a regression: `parity:api`
reports `rack-test` against 90 public methods with 0 ported; `parity:test`
reports `rack-test: 8 files, 234 tests` with 0 credited.

`scripts/api-compare/extra-surface-mark.json` is NOT touched — enrolling a
package in `GATED_PACKAGES` is its own reviewed burndown (CLAUDE.md).

## Acceptance criteria

- [ ] All five registrations above landed in one PR.
- [ ] `scripts/test-compare/compare.test.ts` gains cases for the eight mappings
      above, beside the rack-session cases at `:157-159`.
- [ ] `pnpm parity:api` prints a `rack-test` row; `pnpm parity:test` prints
      `rack-test: 8 files, 234 tests`.
- [ ] `blazetrails/rails-private-jsdoc` is run with `--fix` in the same PR (the
      extractor reports 17 of the 90 methods internal — RFC Open Question 1), so
      the manifest addition does not leave the `rails-comparison` CI job red.
- [ ] `pnpm parity:api` / `parity:test` deltas for every other package are
      non-negative.
- [ ] `pnpm parity:api:extra --package rack-test` runs and reports; no baseline or
      mark is widened.

## Definition of done

Adding `rack-test` to `GATED_PACKAGES` in
`scripts/api-compare/extra-surface-mark.json` does not close this story and is
not part of it — gating a package is its own reviewed burndown (CLAUDE.md).
Nor does widening any baseline or mark to absorb the new package's day-one
numbers: 0/90 and 0/234 are the honest baseline and they belong in the report,
not in an allowlist.
