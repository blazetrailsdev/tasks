---
title: "i18n-converge-key-value-api-deferral"
status: closed
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Done by PR #6060 — the stale backend/key_value.rb and backend/flatten.rb deferrals are deleted and both suites count again. Residual gaps tracked by i18n-key-value-residual-api-gaps."
---

## Context

`scripts/api-compare/unported-files.ts` still defers `backend/key_value.rb` and
`backend/flatten.rb` for package `i18n`, but both are in fact ported:
`packages/i18n/src/backend/key-value.ts` (280 lines, `class KeyValue extends
Base`) and `packages/i18n/src/backend/flatten.ts`. Rails source:
`vendor/i18n/lib/i18n/backend/key_value.rb:69-75` and
`vendor/i18n/lib/i18n/backend/flatten.rb`.

Because the manifest still calls them deferred, PR #6060 (story
`i18n-test-compare-deferred-suite-exclusions`) had to exclude
`backend/key_value_test.rb` and `api/key_value_test.rb` from `parity:test`
alongside every other deferred backend — dropping 14 already-green matched
cases. That is the uniform reading of the manifest, but it is debt, not the
end state.

Measured cost of converging (deleting the `backend/key_value.rb` entry, with
`API_COMPARE_FORCE=1 pnpm parity:api`):

- before: `i18n — 130/136 methods (95.6%) | files: 13/13 | inheritance: 6/6`
- after: `i18n — 161/170 methods (94.7%) | files: 14/14 | inheritance: 6/7`

So +31 matched methods and +1 matched file, at the cost of surfacing 3 more
missing methods and 1 inheritance mismatch on `KeyValue` — all genuine gaps
that are currently hidden.

Note `scripts/api-compare/unported-files.test.ts` ("accounts for every file in
the vendored i18n lib tree") already fails on `origin/main` with `locale.rb`
and `locale/tag.rb` unaccounted; its `inScope` set will need `backend/key_value.rb`
added, and that pre-existing failure resolved or left as-is deliberately.

## Acceptance criteria

- The `backend/key_value.rb` entry (and `backend/flatten.rb` if likewise ported)
  is deleted from `UNPORTED_FILES`, not reworded.
- `backend/key_value.rb` is added to the `inScope` set in
  `scripts/api-compare/unported-files.test.ts`.
- The `testFile:` exclusions for `backend/key_value_test.rb` and
  `api/key_value_test.rb` added by #6060 are removed in the same change, so the
  suites count again.
- `pnpm parity:api` / `pnpm parity:test` i18n matched counts do not regress.
- The remaining `KeyValue` missing methods and the inheritance mismatch are
  either closed or filed as their own story.
