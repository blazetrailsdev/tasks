---
title: "Enroll i18n in parity:test and port core suites"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-api-compare-enrollment"]
deps-rfc: []
est-loc: 500
pr: 6002
claim: "2026-08-03T18:08:46Z"
assignee: "i18n-test-compare-enrollment"
blocked-by: null
closed-reason: null
---

# Enroll i18n in parity:test (flip compareTests) and port the core suites

## Context

`vendor/sources.ts` i18n entry has `compareTests: false`; flipping adds
`vendor/i18n/test` to `testPathsManifest()` (`vendor/sources.ts:275`) which
feeds `extract-ruby-tests.rb`. Core suites to port/match first:

- `vendor/i18n/test/i18n_test.rb` (facade behavior)
- `vendor/i18n/test/backend/simple_test.rb`
- `vendor/i18n/test/api/` (shared API suites over the simple backend)
- `vendor/i18n/test/utils_test.rb`

Deferrable suites (chain/fallbacks/key-value/cache/gettext/etc.) mirror the
api-compare exclusions. Test names must match exactly — test-compare matches
on names (CLAUDE.md: never rename). Depends on the api-compare enrollment
story.

## Acceptance criteria

- `compareTests: true` (flag removed) in `vendor/sources.ts`;
  `vendor/sources.test.ts` updated.
- `pnpm parity:test` runs clean with an i18n section; ported core suites
  match by name; deferred suites excluded with reasons via the existing
  mechanism.
- No test renames of existing trails tests to force matches.
