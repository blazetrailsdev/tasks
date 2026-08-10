---
title: "Port the nine remaining i18n_test.rb cases"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6047
claim: "2026-08-04T03:10:54Z"
assignee: "i18n-facade-remaining-test-cases"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --missing` reports `i18n_test.rb -> i18n.test.ts 73/82`, nine
cases short. The facade itself is ported (`packages/i18n/src/i18n.ts`,
`parity:api` i18n.rb 100%), so these are test gaps, not surface gaps:

```text
  - exposes its VERSION constant
  - default_locale= doesn't ignore junk
  - sets the current locale to Thread.current
  - locale= doesn't ignore junk
  - localize given nil raises an I18n::ArgumentError
  - localize given nil and default returns default
  - localize given an Object raises an I18n::ArgumentError
  - localize given an unavailable locale rases an I18n::InvalidLocale
  - I18n.locale is preserved in Fiber context
```

Sources: `vendor/i18n/test/i18n_test.rb`; the `localize` arms exercise
`vendor/i18n/lib/i18n.rb:336` and `vendor/i18n/lib/i18n/backend/base.rb`'s
`localize` guards (`raise I18n::ArgumentError` on nil/Object), which
`packages/i18n/src/backend/base.ts` already ports — so four of the nine should
pass as written.

Two are Ruby-runtime-specific (`Thread.current`, `Fiber` context) and one is
`VERSION` (`vendor/i18n/lib/i18n/version.rb`, excluded via
`scripts/api-compare/unported-files.ts:1224`); those need an exclusion with a
reason rather than a port.

## Acceptance criteria

- The four `localize` cases and the two `*= doesn't ignore junk` cases are
  ported into `packages/i18n/src/i18n.test.ts` with their Rails names verbatim,
  and pass against the current facade (or, if one fails, the **implementation**
  is fixed — never the test name).
- `exposes its VERSION constant`, `sets the current locale to Thread.current`
  and `I18n.locale is preserved in Fiber context` are excluded through the
  existing test-compare mechanism, each with a one-line reason.
- `pnpm parity:test` shows `i18n_test.rb` with no remaining un-excluded gap.
