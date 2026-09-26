---
title: "ActiveModel::RangeError extends JS RangeError instead of Ruby core ::RangeError"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares `class RangeError < ::RangeError` (`activemodel/lib/active_model/errors.rb:523`), with Ruby core's
`::RangeError` as the parent. trails' `packages/activemodel/src/errors.ts` (`export class RangeError`, near line 352)
extends `globalThis.RangeError`, the JS built-in, because ruby-compat had no Ruby-core `RangeError`. trails#8119 added
one (`packages/ruby-compat/src/range-error.ts`, `RangeError < StandardError`, `vendor/ruby/error.c:3329`), so the
Ruby chain `ActiveModel::RangeError < ::RangeError < StandardError` can now be expressed. Today a Ruby
`rescue RangeError` or `rescue StandardError` port does not catch `ActiveModel::RangeError`.

## Acceptance criteria

- [ ] `ActiveModel::RangeError` extends ruby-compat's `RangeError`, with `name` set on the prototype as the other ruby-compat-rooted classes do.
- [ ] `ActiveModel::RangeError` is `instanceof` both ruby-compat `RangeError` and `StandardError`.
- [ ] `blazetrails/rails-error-parity` lint and the activemodel range-error tests stay green.
