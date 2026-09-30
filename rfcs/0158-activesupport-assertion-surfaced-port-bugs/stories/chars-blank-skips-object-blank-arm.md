---
title: "chars-blank-skips-object-blank-arm"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

ActiveSupport reopens `Object` with `blank?`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/blank.rb:18`:
`respond_to?(:empty?) ? !!empty? : false`). `ActiveSupport::Multibyte::Chars`
is an Object, so `"  ".mb_chars.blank?` finds `Object#blank?` before
`Chars#method_missing` (`multibyte/chars.rb:59-67`) can forward to the wrapped
String. It answers `!!empty?`, which is `false`.

trails' `Chars` (`packages/activesupport/src/multibyte/chars.ts`) has no
`Object#blank?` arm. Its Proxy `get` forwards every name `rbStrRespondTo`
answers. Since trails#8300, `core-ext/object/blank.ts` reopens String through
`STRING_METHOD_TABLE.isBlank`, as `blank.rb:153` does. So `isBlank(mbChars("  "))`
now forwards to `String#blank?` and answers `true`. Before, it threw
`NoMethodError`. Both answers are wrong.

## Acceptance criteria

- [ ] `Chars` answers `blank?` through `Object#blank?`'s `respond_to?(:empty?) ? !!empty? : false`, found before the `method_missing` forward, as in Ruby's lookup order.
- [ ] `isBlank(mbChars("  "))` is `false` and `isBlank(mbChars(""))` is `true`, covered by a `.trails.test.ts`.
