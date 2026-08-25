---
title: "i18n-config-writer"
status: closed
updated: 2026-08-03
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
closed-reason: "Superseded — ported in #6002 alongside the parity:test enrollment"
---

# Port the `I18n.config=` writer and its i18n_test case

## Context

`i18n/lib/i18n.rb` exposes `config` and `config=` on `I18n::Base`; the writer
stores the configuration object so a host can swap the whole config in one
move. trails ported the reader (`config()` in `packages/i18n/src/i18n.ts`) and
the `resetConfig()` test seam, but not the writer, so
`i18n/test/i18n_test.rb:79` — `test "can set the configuration object"` — is
the one remaining non-Ruby-specific gap in `i18n_test.rb` after #6002
(`pnpm parity:test --package i18n` shows `i18n_test.rb` at 68/82).

The Ruby test has two assertions: `I18n.config = self` round-trips through
`I18n.config`, and the same object is visible at
`Thread.current.thread_variable_get(:i18n_config)`. The second has no JS
analogue — trails' `config()` is a process singleton (documented at
`packages/i18n/src/i18n.ts` `config`), so only the round-trip arm ports.

## Acceptance criteria

- `setConfig` in `packages/i18n/src/i18n.ts`, following the `set*` writer
  spelling the surrounding delegators already use (`setLocale`,
  `setBackend`, …), exported from `index.ts`.
- `test "can set the configuration object"` ported into
  `packages/i18n/src/i18n.test.ts` under its verbatim Rails name, asserting the
  round-trip arm; the Thread-local arm is dropped with the reason at the call
  site.
- `pnpm parity:test --package i18n` shows `i18n_test.rb` at 69/82.
