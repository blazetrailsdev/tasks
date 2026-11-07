---
title: "Delegator#methodMissing takes delegate.rb's ::Kernel arm"
status: draft
updated: 2026-11-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails:

- `packages/ruby-compat/lib/delegate.ts`, `Delegator#methodMissing` (added in trails#9817)

Ruby:

- `vendor/ruby/v3.3.11/lib/delegate.rb:82-93`

Ruby's `Delegator#method_missing` has three arms: forward to the target if it responds; `elsif ::Kernel.method_defined?(m) || ::Kernel.private_method_defined?(m)` → `::Kernel.instance_method(m).bind_call(self, *args, &block)`; else `super`. The port has the first and last only. A name in `KERNEL_METHODS` (`method-missing-proxy.ts`) that the target does not answer reaches the `NoMethodError` arm instead of running the Kernel method on the delegator.

## Acceptance criteria

- [ ] `Delegator#methodMissing` takes the Kernel arm in Ruby's order, dispatching a `KERNEL_METHODS` name to the ruby-compat Kernel implementation bound to the delegator (`rbObj*` for that name), before the `NoMethodError` raise.
- [ ] A test: a `SimpleDelegator` over an object without `itself` (or another Kernel name) answers through the Kernel arm.
