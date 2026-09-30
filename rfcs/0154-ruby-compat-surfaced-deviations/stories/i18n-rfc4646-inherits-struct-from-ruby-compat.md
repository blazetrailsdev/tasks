---
title: "i18n: Rfc4646 gets Struct ==/eql?/hash from ruby-compat's Struct.new"
status: draft
updated: 2026-09-30
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

`I18n::Locale::Tag::Rfc4646 < Struct.new(*RFC4646_SUBTAGS)`
(`vendor/i18n/v1.14.8/lib/i18n/locale/tag/rfc4646.rb:11,14`) inherits Struct's
`==` / `eql?` / `hash` / `members` (`vendor/ruby/v3.3.11/struct.c:1400,1481,1432,227`).
trails' `Rfc4646` (`packages/i18n/src/locale/tag/rfc4646.ts:28`) is a plain
class with none of them, so `rbEqual` / `rbHash` over two equal tags fall back
to identity.

trails#8300 added `Struct` to ruby-compat (`packages/ruby-compat/src/struct.ts`):
`Struct.new(...members)` is a module that a class `include`s where Ruby would
inherit from the Struct. `Arel::Attributes::Attribute` uses it.

## Acceptance criteria

- [ ] `Rfc4646` does `include(Rfc4646, Struct.new("language", "script", "region", "variant", "extension", "privateuse", "grandfathered"))`, typed through `StructInstance`, with each member readable by name.
- [ ] `rbEqual` / `rbEql` / `rbHash` over two `Rfc4646` tags with the same subtags agree, covered by a `.trails.test.ts`.
- [ ] Add `i18n/src/locale/tag/rfc4646.ts` to the call sites of the `Struct` row in the ruby-compat README.
