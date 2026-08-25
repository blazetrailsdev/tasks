---
title: "core-ext-conversions-array-and-numeric"
status: closed
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: its scope stays with the still-open parent core-ext-sweep-array-and-numeric after PR #6454 shipped only part of that slot."
---

## Context

Left out of #6454 (RFC 0098 slot D). `pnpm parity:api --package activesupport`
after that PR:

- `core_ext/array/conversions.rb` → `array-utils.ts` 1/4: missing `to_fs`,
  `to_formatted_s`, `to_xml` (`vendor/rails/activesupport/lib/active_support/core_ext/array/conversions.rb`).
- `core_ext/numeric/conversions.rb` → `core-ext/numeric/conversions.ts` 0/2
  (NO TS FILE): `to_fs`, `to_formatted_s` on `ActiveSupport::NumericWithFormat`.
- `core_ext/array/access.rb` 14/15: `compact_blank!`, which Rails actually
  defines in `core_ext/enumerable.rb:263` — check where the compare wants it
  before placing it.

`Array#to_fs`/`Numeric#to_fs` route through `number_helper`, already ported in
`packages/activesupport/src/number-helper/`.

## Acceptance criteria

- The three files report 0 missing (or a reasoned SKIP row for `to_xml`, which
  needs the XmlMini builder path).
- `parity:api` delta non-negative; call/args ratchets green.
