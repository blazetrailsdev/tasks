---
title: "assertions-activesupport-multibyte-chars-port"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: null
---

## Context

These are the rows left after
`assertions-activesupport-string-ext-multibyte-safe-buffer`. Nothing from that
story converged: every remaining row needs `ActiveSupport::Multibyte::Chars`
(`vendor/rails/activesupport/lib/active_support/multibyte/chars.rb`) and
`String#mb_chars`.

- `multibyte_chars_test.rb` (110 rows).
- `core_ext/string_ext_test.rb` (8 rows): `core ext adds mb chars`,
  `mb chars returns instance of proxy class`,
  `string should recognize utf8 strings`,
  `truncates bytes preserves encoding` and `string to datetime`.
- `safe_buffer_test.rb` `Should not fail if the returned object is not a string`.

## Acceptance criteria

- `Multibyte::Chars` is ported at its convention path.
- The three files report 0 count/kind/value mismatches.
