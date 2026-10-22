---
title: "extractOptionsBang pops a plain-object module as an options hash"
status: draft
updated: 2026-10-22
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extractOptionsBang` (`packages/activesupport/src/hash-utils.ts:139-148`) pops any trailing plain object. Rails' `Array#extract_options!` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/array/extract_options.rb:24-30`) pops only a Hash whose `extractable_options?` is true (`:9-11`, `instance_of?(Hash)`). RFC 0197 makes a Ruby module a plain object, so `rescueFrom(PlainModule, block)` reads the module as its options hash and records no handler. `rescuable_test.rb:14-18`'s `module WeirdError` had to be ported as a class module in trails#9208 to avoid this. `Rescuable::ClassMethods#rescue_from` (`rescuable.rb:51-73`) also only admits `klass.is_a?(Module)`, and `packages/activesupport/src/rescuable.ts:55-59` checks `instanceof Module` and has no plain-module arm.

## Acceptance criteria

- `extractOptionsBang` does not pop a plain-object module: one carrying a classpath (`rbModName` non-null) or a module brand.
- `rescueFrom` accepts a plain-object module as `klass` (the `is_a?(Module)` arm).
- `rescuable.test.ts`'s `WeirdError` is a plain object with a non-enumerable singleton `caseEquals`, as `module WeirdError; def self.===`.
