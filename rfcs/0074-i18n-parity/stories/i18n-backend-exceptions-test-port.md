---
title: "Port i18n/test/backend/exceptions_test.rb"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6009
claim: "2026-08-03T19:11:45Z"
assignee: "i18n-backend-exceptions-test-port"
blocked-by: null
closed-reason: null
---

# Port i18n/test/backend/exceptions_test.rb

## Context

`parity:test --package i18n` reports `backend/exceptions_test.rb` at 0/4 after
the test-compare enrollment (#6002). The four cases assert the _message_ a
`MissingTranslation` / `MissingTranslationData` carries when raised from a real
lookup, i.e. that the scope and key are threaded into the message:

- `vendor/i18n/test/backend/exceptions_test.rb:9` — `:throw => true` from
  `#translate` yields `"Translation missing: en.foo.bar.baz.missing"`.
- `:17` — `:raise => true` from `#translate`, same message.
- `:25` — from `#localize` with an unknown `:format`, yielding
  `"Translation missing: en.time.formats.foo"`.
- the fourth case in the same file.

Cases 1 and 2 are portable today: `translate` and the throw/raise arms are on
the facade (`packages/i18n/src/i18n.ts`), and `catchException` in
`throw-catch.ts` is the `catch(:exception)` analogue. Case 3 depends on
`Backend::Base#localize` (`vendor/i18n/lib/i18n/backend/base.rb:78`), which
the `i18n-backend-localize` story ports — sequence after it or leave that one
case measured as missing.

## Acceptance criteria

- `packages/i18n/src/backend/exceptions.test.ts` carries the cases under their
  verbatim Rails names.
- Nothing added to `scripts/api-compare/unported-files.ts`; unportable cases
  stay visible as missing in `parity:test`.
