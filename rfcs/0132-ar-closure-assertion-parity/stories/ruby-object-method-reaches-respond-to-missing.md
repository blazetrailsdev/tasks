---
title: "ruby-object-method-reaches-respond-to-missing"
status: draft
updated: 2026-09-22
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

Split from `multibyte-chars-ruby-string-method-table`. `MultibyteCharsUTF8BehaviorTest`
`method works for proxyed methods` (`vendor/rails/activesupport/test/multibyte_chars_test.rb`)
calls `"hello".mb_chars.method(:slice).call(2..3)` and expects `NameError` for
`method(:undefined_method)`. Ruby's `Kernel#method` (`vendor/ruby/proc.c` `rb_obj_method` /
`obj_method`) answers a `Method` object, falling back to `respond_to_missing?` to build a
method that dispatches through `method_missing` (`mnew_missing`). ruby-compat has no
`Object#method` / `Method` port, so the test stays parked `it.skip` with
`// BLOCKED: ruby-object-method-reaches-respond-to-missing` in
`packages/activesupport/src/multibyte-chars.test.ts`.

`Chars#method_missing` / `respond_to_missing?` now dispatch through ruby-compat's
`STRING_METHOD_TABLE` (`packages/ruby-compat/src/string/method-table.ts`), so the only
missing piece is `Object#method` itself.

## Acceptance criteria

- ruby-compat ports `rb_obj_method` (a free function, e.g. `rbObjMethod(obj, name)`) answering
  a `Method` with `call`, reaching `respond_to_missing?` / `method_missing` as `mnew_missing` does,
  and raising `NameError` ("undefined method 'x' for an instance of Y") otherwise.
- `method works for proxyed methods` is unskipped and passes.
