---
title: "i18n: Base#pluralize ignores a plain-object default Hash"
status: draft
updated: 2026-11-17
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

`I18n::Tests::Pluralization` (`vendor/i18n/v1.14.8/lib/i18n/tests/pluralization.rb:6-31`) passes a literal Hash default:
`I18n.t(:default => { :zero => 'zero' }, :count => 0)`. In trails, `Base#pluralize` (`packages/i18n/lib/backend/base.ts:404-406`)
recognises a hash only through `isHash` (`value instanceof Map`, `base.ts:130-131`). So the plain-object default `{ zero: "zero" }`
comes back unpluralized. The ported test (`packages/i18n/test/support/tests/pluralization.ts`, trails#10259) has to pass
`new Hash().set(":zero", "zero")`. CLAUDE.md says "A Ruby Hash is a plain object unless it needs a `Hash` feature".

Rails' `pluralize` (`vendor/i18n/v1.14.8/lib/i18n/backend/base.rb`, `entry.is_a?(Hash)`) accepts any Hash.

## Acceptance criteria

- [ ] A plain-object default (`t(null, { default: { zero: "zero" }, count: 0 })`) pluralizes as the Rails Hash does,
      or Translation data's representation is converged so a caller-supplied default is normalized into it.
- [ ] `pluralization.ts` passes plain-object defaults as the Rails literals.
