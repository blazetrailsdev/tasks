---
title: "Regexp.escape of a non-String raises a JS TypeError, not MRI's no-implicit-conversion TypeError"
status: draft
updated: 2026-10-05
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

Surfaced by trails#8544. `Regexp.escape(nil)` raises `TypeError` "no implicit conversion of
nil into String" in MRI 3.3 (`rb_reg_s_quote` converts its argument with `reg_operand`,
`vendor/ruby/v3.3.11/re.c`). `regexpEscape` (`packages/ruby-compat/src/regexp.ts:16`) calls
`string.replace` directly, so a `null` raises a JS-native `TypeError` "Cannot read properties
of null (reading 'replace')": the host's class, not ruby-compat's, with a different message.

The reachable caller is `ActiveModel::AttributeMethods::ClassMethods::AttributeMethodPattern#initialize`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:476-483`):
`attribute_method_prefix(nil)` binds nil as a prefix (`:106`) and raises at `:480`. The port
(`packages/activemodel/src/attribute-methods.ts`, `AttributeMethodPattern`) reaches
`regexpEscape(null)` for a null prefix, and for a null suffix throws earlier, at
`suffix.endsWith("!")`, a read the Ruby body does not make before `Regexp.escape`.

## Acceptance criteria

- [ ] `regexpEscape` of a non-String raises ruby-compat's `TypeError` with MRI's message
      ("no implicit conversion of nil into String" for nil), cited to `re.c`.
- [ ] `new AttributeMethodPattern({ suffix: null })` raises that same error from the
      `Regexp.escape` site, as `attribute_methods.rb:480` does.
- [ ] `attribute-methods.trails.test.ts`'s "binds a trailing null as a prefix or suffix" case
      asserts the message instead of `not.toThrow(/parameters/)`.
