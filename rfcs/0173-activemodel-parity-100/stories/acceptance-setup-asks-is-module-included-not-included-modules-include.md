---
title: "activemodel: AcceptanceValidator#setup! asks isModuleIncluded where Rails asks included_modules.include?"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8397
claim: "2026-10-02T13:21:59Z"
assignee: "arel-bind-param-nil-answers-false-for-undefined"
blocked-by: null
closed-reason: null
---

## Context

`AcceptanceValidator#setup!`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/acceptance.rb:18-21`):

```ruby
define_attributes = LazilyDefineAttributes.new(attributes)
klass.include(define_attributes) unless klass.included_modules.include?(define_attributes)
```

Two calls on the guard: `included_modules`, then `Array#include?`, which
compares with `==` — and `LazilyDefineAttributes#==` (`acceptance.rb:71-73`) is
by value, so a second validator over the same attributes does not include a
second module.

`packages/activemodel/src/validations/acceptance.ts:34-39` asks
`isModuleIncluded(klass, defineAttributes)` instead — ruby-compat's
`Module#include?` (`packages/ruby-compat/src/include.ts:726`), which was taught
to consult a module's `equals` precisely to stand in for this line. The call
gate reports the omitted `include?`, receipted
`@missingRailsCall include? — CONVERGEABLE acceptance-setup-asks-is-module-included-not-included-modules-include`.

`includedModules` exists (`include.ts:756`); what is missing is an
`Array#include?` that compares through `rbEqual`, so the Rails line can be
written as it reads. No CLAUDE.md section ratifies the substitution.

Found by `activemodel-audit-permanent-receipts-subdirs`.

## Acceptance criteria

- [ ] `setupBang`'s guard is `includedModules(klass)` followed by an
      `include?` that compares with `rbEqual`, so `LazilyDefineAttributes#equals`
      still answers it.
- [ ] `isModuleIncluded` drops the `equals` arm it grew for this caller if no
      other caller needs it (`rb_mod_include_p`, `vendor/ruby/v3.3.11/class.c:1538`,
      compares identity).
- [ ] The `@missingRailsCall include?` receipt is deleted; `pnpm parity:api:calls` green.
- [ ] `acceptance-validation.test.ts` green, including the lazily-defined
      attribute tests.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activemodel/src/validations/acceptance-validation.test.ts packages/ruby-compat/src/include.test.ts
```
