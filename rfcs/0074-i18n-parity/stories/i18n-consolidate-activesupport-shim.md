---
title: "Consolidate the activesupport i18n shim"
status: ready
updated: 2026-07-26
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-facade-translate-interpolate"]
deps-rfc: []
est-loc: 450
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Consolidate the activesupport i18n shim onto @blazetrails/i18n

## Context

`packages/activesupport/src/i18n.ts` (439 lines) is a hand-rolled facade +
`SimpleBackend` (`:34-56`) with Rails' `en` date/time defaults
(`DAYNAMES`/`MONTHNAMES`, `date.formats`, etc. — these belong in the
activesupport locale data, mirroring
`vendor/rails/activesupport/lib/active_support/locale/en.yml`, not in the
i18n library). Consumers to reroute: `grep -rn "from .*i18n" packages/activesupport/src`
(inflector transliterate, number_helper, core_ext conversions,
`html-safe-translation.ts`). Depends on the facade story; does not require
the enrollment stories.

## Acceptance criteria

- activesupport imports `I18n` from `@blazetrails/i18n`; its own facade and
  `SimpleBackend` are deleted (no delegation wrappers left behind —
  see #5346's transparency rule).
- The `en` date/time locale data moves to an activesupport-owned locale
  module loaded into the shared backend, mirroring Rails'
  `active_support/locale/en.yml`.
- Existing activesupport tests pass unchanged (names untouched).
