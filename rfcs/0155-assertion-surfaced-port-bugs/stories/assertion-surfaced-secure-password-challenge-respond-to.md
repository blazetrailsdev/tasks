---
title: "assertion-surfaced-secure-password-challenge-respond-to"
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
closed-reason: "fixed in trails#7901 — the challenge validator reaches _digest_was through rbObjRespondTo"
---

## Context

`packages/activemodel/src/secure-password.test.ts` ›
`updating a user without dirty tracking and a correct password challenge` is parked
`it.skip` with its converged body. It fails with
`TypeError: record.respondTo is not a function`.

Rails (`vendor/rails/activemodel/lib/active_model/secure_password.rb:141`) writes

```ruby
digest_was = record.public_send(:"#{attribute}_digest_was") if record.respond_to?(:"#{attribute}_digest_was")
```

`respond_to?` is `Object#respond_to?` — every receiver answers it. The trails port
(`packages/activemodel/src/secure-password.ts:47`) writes `record.respondTo(...)`,
a method only models that carry `AttributeMethods` define, so a record without
`ActiveModel::Dirty` (Rails' `Visitor`,
`vendor/rails/activemodel/test/models/visitor.rb:3-13`, and the
`has_secure_password :untracked` subclass at
`vendor/rails/activemodel/test/cases/secure_password_test.rb:210-221`) raises
instead of taking the `digest_was = nil` arm.

The fix is `rbObjRespondTo(record, ...)` from `@blazetrails/ruby-compat`
(`packages/ruby-compat/src/object.ts:69`), which is the settled port of
`Object#respond_to?` and falls back to `basicObjRespondTo` when the receiver has
no `respondTo` of its own.

## Acceptance criteria

- [ ] `secure-password.ts`'s challenge validator reaches `_digest_was` through
      `rbObjRespondTo`, matching `secure_password.rb:141`.
- [ ] `updating a user without dirty tracking and a correct password challenge`
      un-skips and passes with its converged body unchanged.
- [ ] No test renamed; activemodel assertion parity for `secure_password_test.rb`
      stays at 0.
