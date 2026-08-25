---
title: "Wire test-compare exclusions for the deferred i18n backends"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6060
claim: "2026-08-04T13:48:10Z"
assignee: "i18n-test-compare-deferred-suite-exclusions"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` reports i18n at **216/440 tests (49.1%), 10/38 files** — but
most of the 28 ✗ files are suites for backends this RFC declares deferrable and
already excludes from `parity:api`:

```text
backend/cascade_test.rb 2/8 · backend/pluralization_test.rb 1/13
backend/cache_test.rb 0/10 · backend/cache_file_test.rb 0/3
backend/key_value_test.rb 0/14 · backend/lazy_loadable_test.rb 0/13
backend/interpolation_compiler_test.rb 0/9 · backend/memoize_test.rb 0/5
backend/metadata_test.rb 0/8 · backend/pluralization_{fallback,scope}_test.rb 0/2 each
gettext/api_test.rb 0/34 · gettext/backend_test.rb 0/11
i18n/gettext_plural_keys_test.rb 0/3 · i18n/middleware_test.rb 0/2
api/{all_features,cascade,chain,fallbacks,key_value,lazy_loadable,memoize,
     override,pluralization}_test.rb — 12 one-line "make sure we use X" cases
```

RFC 0074 README ("Deferrable surface") lists exactly these, and
`scripts/api-compare/unported-files.ts:1141-1224` already carries the api-side
entries — but none of those entries sets `testFile:`, so the test side still
counts every case. The result is an i18n test percentage that can never reach
100% and cannot distinguish "unported deferred suite" from "real test gap".

## Acceptance criteria

- The i18n entries in `scripts/api-compare/unported-files.ts` gain `testFile:`
  for their suites (or the equivalent test-compare exclusion mechanism), each
  reusing its existing reason.
- Only suites whose implementation file is already deferred are excluded —
  `backend/chain_test.rb` (story `i18n-backend-chain`, claimed) and
  `locale/tag/*` (story `i18n-locale-tag-rfc4646`, blocked) stay counted since
  those are being ported.
- After the change, `pnpm parity:test`'s i18n section lists only suites with a
  ported implementation, and the remaining ✗ rows are genuine gaps.
- No trails test is renamed to force a match.
