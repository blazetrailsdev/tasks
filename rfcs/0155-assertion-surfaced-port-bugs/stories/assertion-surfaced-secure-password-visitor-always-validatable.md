---
title: "assertion-surfaced-secure-password-visitor-always-validatable"
status: closed
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
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
closed-reason: "fixed in trails#7901 — hasSecurePassword now includes Validations and Visitor is a bare class, so the test runs"
---

## Context

`packages/activemodel/src/secure-password.test.ts` ›
`don't include ActiveModel::Validations when validations are disabled` is parked
`it.skip` with its converged body (`assertNotRespondTo(visitor, "isValid")`).

Rails (`vendor/rails/activemodel/test/cases/secure_password_test.rb:32-34`) asserts
`assert_not_respond_to @visitor, :valid?`. `Visitor`
(`vendor/rails/activemodel/test/models/visitor.rb:3-13`) is a bare Ruby class that
includes only `ActiveModel::SecurePassword` and calls
`has_secure_password(validations: false)`, so `include ActiveModel::Validations`
(`activemodel/lib/active_model/secure_password.rb:128`) never runs and the instance
does not respond to `valid?`.

In trails every model extends `Model`, which already carries `isValid`, so the
predicate is true regardless of `validations: false`. Two halves are missing:

- `hasSecurePassword` (`packages/activemodel/src/secure-password.ts:39-67`) never
  spells `include ActiveModel::Validations` — it assumes the host already has it.
- `packages/activemodel/src/test-helpers/models/visitor.ts` mirrors Rails' bare
  class by extending `Model`, because a plain TS class has no `validate` for the
  `has_secure_password :untracked` subclass in
  `secure_password_test.rb:210-221` to call.

## Acceptance criteria

- [ ] `Validations` is mixed in by `hasSecurePassword` when `validations` is true,
      not assumed on the host, so a model without it does not respond to `isValid`.
- [ ] `don't include ActiveModel::Validations when validations are disabled`
      un-skips and passes with its converged body unchanged.
- [ ] No test renamed; activemodel assertion parity for `secure_password_test.rb`
      stays at 0.
