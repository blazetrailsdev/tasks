---
title: "i18n-interpolation-key-symbol-spelling"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6023
claim: "2026-08-03T21:11:08Z"
assignee: "i18n-interpolation-key-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

`I18n::MissingInterpolationArgument` and `I18n::ReservedInterpolationKey`
render their key with `key.inspect`
(`vendor/i18n/lib/i18n/exceptions.rb:102` and `:108`), which yields `:bar` for
the Symbol interpolation keys the everyday path passes and `"key"` for a
String. `packages/i18n/src/exceptions.ts:28` instead has an `inspectSymbol`
helper that prefixes a colon onto _every_ string, so the String arm is
unreachable.

CLAUDE.md now settles the representation: a Ruby Symbol keeps its leading
colon in the string (`":bar"`), so `inspect` alone is faithful and both arms
survive. Callers that produce these keys are
`packages/i18n/src/config.ts:158` (the default
`missingInterpolationArgumentHandler`), `interpolate/ruby.ts:37` and
`backend/base.ts:150`, all of which currently pass a bare name.

This is what keeps
`i18n/test/backend/exceptions_test.rb:32` ("MissingInterpolationArgument
message includes missing key, provided keys and full string") measured as
missing after the `i18n-backend-exceptions-test-port` story (#6009).

## Acceptance criteria

- Interpolation keys reaching `MissingInterpolationArgument` /
  `ReservedInterpolationKey` carry the colon-prefixed Symbol spelling, and the
  messages are built with `inspect`, not `inspectSymbol`.
- `i18n/test/backend/exceptions_test.rb:32` is ported into
  `packages/i18n/src/backend/exceptions.test.ts` under its verbatim Rails name
  and passes; `i18n/test/i18n/exceptions_test.rb:59` still passes.
- `pnpm parity:test --package i18n` does not regress.
