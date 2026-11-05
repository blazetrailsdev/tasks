---
title: "stub-any-instance-does-not-intercept-js-new"
status: draft
updated: 2026-11-05
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

`stub_any_instance` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/method_call_assertions.rb:59-64`) stubs `klass.new`. trails' `stubAnyInstance` (`packages/activesupport/src/testing/method-call-assertions.ts:232`) swaps a static `new`, but `Mail::Message#delivery_method` builds with `new klass(settings)` (`packages/mail/src/message.ts:137`), and `ActionMailer::Base` builds `new Message()`. So the stub never intercepts, and two `delivery_methods_test.rb` tests are parked in `packages/actionmailer/src/delivery-methods.test.ts`: "delivery method can be customized per instance" (`delivery_methods_test.rb:111-120`) and "does not perform deliveries if requested" (`:172-184`).

## Acceptance criteria

- `stubAnyInstance` intercepts construction of `klass` as Ruby's stubbed `klass.new` does.
- Both tests unskipped and passing, with unchanged names.
