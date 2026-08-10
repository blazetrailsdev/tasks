---
title: "transliterator: invalid UTF-8 raise case"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6062
claim: "2026-08-04T13:53:57Z"
assignee: "i18n-transliterator-invalid-utf8-test"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --missing` reports
`backend/transliterator_test.rb -> backend/transliterator.test.ts 12/13`, one
case short:

```text
  - default transliterator raises errors for invalid UTF-8
```

Rails/gem source: `vendor/i18n/test/backend/transliterator_test.rb`; the
implementation arm is `I18n::Backend::Transliterator::HashTransliterator`'s
`transliterate` in `vendor/i18n/lib/i18n/backend/transliterator.rb`, ported at
`packages/i18n/src/backend/transliterator.ts`. Story
`i18n-backend-transliterator-tests` is `done`, so this straggler has no owner.

The Ruby case asserts an `ArgumentError`-family raise on a byte string that is
not valid UTF-8. JS strings are UTF-16 and cannot hold invalid UTF-8 bytes the
same way, so the port must decide: reproduce the raise for the closest JS
analogue (a lone surrogate), or exclude the case through the existing
test-compare mechanism with that reason.

## Acceptance criteria

- Either the case is ported with its Rails name verbatim and the
  transliterator raises for the JS analogue of invalid UTF-8, or it is excluded
  through the existing mechanism with a one-line reason naming the UTF-16 fact.
- No rename of the existing trails transliterator tests.
- `pnpm parity:test` shows `backend/transliterator_test.rb` with no remaining
  un-excluded gap.
