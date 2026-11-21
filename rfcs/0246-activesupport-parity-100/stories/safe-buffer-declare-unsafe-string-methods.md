---
title: "safe-buffer-declare-unsafe-string-methods"
status: claimed
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-21T13:43:35Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::SafeBuffer` defines the 20 `UNSAFE_STRING_METHODS` and their bang forms
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/output_safety.rb:150-163`).
trails installs them in a loop (`packages/activesupport/lib/core-ext/string/output-safety.ts`,
trails#10360), but cannot declare them on the type side. An `interface SafeBuffer` merge
listing `capitalize`, `strip`, `upcase`, `trS`, … (plus the `…Bang` pairs) makes
`pnpm parity:api:calls` report 13 NEW mismatches in unrelated bodies. Once a TS member
named `strip` / `upcase` / `downcase` / `chop` / `tr` / `reverse` / `unicode_normalize` /
`capitalize` exists in the package, the gate stops crediting native `trim()` / `toUpperCase()`
for those names, for example `encrypted-file.ts read strip`, `multibyte/chars.ts titleize upcase`,
`callbacks.ts compile reverse` and `values/time-zone.ts country_zones upcase`.

## Acceptance criteria

- [ ] The call gate credits the native form at a call site whose receiver is a JS string, even
      when some class in the package declares a member with the Ruby name.
- [ ] `SafeBuffer` declares the 20 unsafe methods and their bang forms via an interface merge,
      and `safe-buffer.test.ts` calls them without casting.
