---
title: "Thread exception: false through kernelInteger's arms as rb_convert_to_integer does"
status: draft
updated: 2026-11-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`kernelInteger(val, base, { exception: false })` (`packages/ruby-compat/lib/kernel-integer.ts`)
was added for `ActionText::TrixAttachment::ATTRIBUTE_TYPES`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/trix_attachment.rb:12-18`). It wraps the
raising form in a try/catch that turns `ArgumentError` / `TypeError` into `null`.
MRI does not work that way. `rb_convert_to_integer(val, base, raise_exception)`
(`vendor/ruby/v3.3.11/object.c:3257`) threads `raise_exception` through each arm: the
base-for-non-string arm returns `Qnil`, `rb_str_convert_to_inum` runs with `badcheck`
and returns nil, and `rb_check_to_int` / `try_to_int` are tried without raising. A
`TypeError` raised from inside a user `to_int` / `to_str` therefore propagates in Ruby,
but the try/catch swallows it. The option also has no direct test.

## Acceptance criteria

- `kernelInteger` threads `exception` through each arm the way `rb_convert_to_integer`
  does (`object.c:3257-3330`), with no blanket try/catch.
- Tests cover `"3.5 MB"` -> null, `nil` -> null, `"12"` -> 12, base given for a non-String -> null,
  and a raising `to_int` still raising.
