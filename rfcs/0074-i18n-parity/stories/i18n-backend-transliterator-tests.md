---
title: "i18n-backend-transliterator-tests"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6019
claim: "2026-08-03T20:46:03Z"
assignee: "i18n-backend-transliterator-tests"
blocked-by: null
closed-reason: null
---

## Context

PR #6015 (story `i18n-facade-transliterate`) ported
`i18n/lib/i18n/backend/transliterator.rb` to
`packages/i18n/src/backend/transliterator.ts` — `get`, `ProcTransliterator`,
`HashTransliterator` and the `transliterate` mixin `Backend::Base` includes
(base.rb:9) — plus the four `i18n_test.rb` cases its story enumerated.

The gem's own suite for the file, `vendor/i18n/test/backend/transliterator_test.rb`
(13 tests per `pnpm parity:test`), is still unported: `parity:test` lists
`backend/transliterator_test.rb → backend/transliterator.test.ts` as 0/13. It
covers the rule arms #6015's four cases do not: a Proc rule, a Hash rule merged
over `DEFAULT_APPROXIMATIONS`, per-locale rule lookup and memoization, and the
explicit `replacement` argument.

## Acceptance criteria

- `packages/i18n/src/backend/transliterator.test.ts` exists and ports
  `vendor/i18n/test/backend/transliterator_test.rb` with the Rails test names
  verbatim.
- `pnpm parity:test` shows the file matched, delta non-negative.
- No production-code changes unless a test surfaces a real fidelity gap in
  `transliterator.ts`; if it does, fix the port, not the test name.
