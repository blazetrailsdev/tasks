---
title: "activemodel: Confirmation/Acceptance validators re-derive defaults Rails merges in initialize, and skip public_send / casecmp / Array()"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while auditing receipts in `activemodel-audit-permanent-receipts-subdirs`
(trails#8365), which converged only the `human_attribute_name` line. The rest of
both validators still diverges from Rails, with no receipt and no gate row
(the pairs are uncompared or the calls are in `NO_JS_CALL_FORM`).

`ConfirmationValidator`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/confirmation.rb`):

- `:6-9` `initialize` — `super({ case_sensitive: true }.merge!(options))`.
  `packages/activemodel/src/validations/confirmation.ts` calls `super(options)`
  and applies the default later, inside `isConfirmationValueEqual`
  (`this.options.caseSensitive ?? true`), so `validator.options` lacks the key
  Rails stores.
- `:12` `validate_each` — `record.public_send("#{attribute}_confirmation")`.
  The port reads the property off a cast record (`rec[confirmationAttr]`).
- `:22-30` `setup!` — `klass.attr_reader(*…)` / `klass.attr_writer(*…)` over
  names `klass.method_defined?` does not answer. The port walks the prototype
  with `inspectAccessor` (`validations/_accessor.ts`) and `Object.defineProperty`.
- `:33-38` `confirmation_value_equal?` — `!options[:case_sensitive] && value.is_a?(String)`
  then `value.casecmp(confirmed) == 0`. The port also requires `confirmed` to
  be a string and folds with `toLowerCase()` (Unicode) where `casecmp` folds
  ASCII only.

`AcceptanceValidator`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/acceptance.rb`):

- `:6-9` `initialize` — `super({ allow_nil: true, accept: ["1", true] }.merge!(options))`.
  `validations/acceptance.ts` calls `super(options)`; the defaults are
  re-derived at two other sites.
- `:11-15` `validate_each` — one `unless acceptable_option?(value)`. The port
  adds an `allowNil` guard (`this.options.allowNil ?? true` and an early
  return) Rails does not have: `EachValidator#validate` already honours
  `allow_nil` from the merged options.
- `:23-25` `acceptable_option?` — `Array(options[:accept]).include?(value)`.
  The port re-derives the `["1", true]` default with `Object.hasOwn` and
  hand-rolls `Kernel#Array` over five arms.

## Acceptance criteria

- [ ] Both constructors merge their defaults into `options` before `super`, as
      `confirmation.rb:7` and `acceptance.rb:7` do; the later re-derivations
      (`?? true`, the `hasAccept` arm, the `allowNil` guard) are deleted.
- [ ] `ConfirmationValidator#validateEach` reads the confirmation through
      `rbFPublicSend`, and `isConfirmationValueEqual` has Rails' one guard and
      an ASCII `casecmp`.
- [ ] `isAcceptableOption` is `Array(options[:accept]).include?(value)` through
      ruby-compat's `Kernel#Array`.
- [ ] `ConfirmationValidator#setupBang` defines the reader / writer through the
      `attr_reader` / `attr_writer` seat and `method_defined?`; coordinate with
      `activemodel-burn-extra-surface-to-zero`, which owns deleting `inspectAccessor`.
- [ ] `confirmation-validation.test.ts`, `acceptance-validation.test.ts` and
      `secure-password.test.ts` stay green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/validations packages/activemodel/src/secure-password.test.ts
```
