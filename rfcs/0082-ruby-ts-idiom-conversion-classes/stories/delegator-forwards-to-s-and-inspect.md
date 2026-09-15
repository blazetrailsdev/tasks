---
title: "DelegateClass forwards to_s/inspect to the delegate like Ruby's Delegator"
status: draft
updated: 2026-09-15
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

Ruby's `Delegator` undefines `to_s`, `inspect`, `!~`, `===`, `<=>` and `hash` from its
`Kernel` copy (`vendor/ruby/lib/delegate.rb:44-49`), so `method_missing`
(`delegate.rb:82-93`) forwards them to `__getobj__`. `DelegateClass` also leaves them out
of the generated forwarders (`delegate.rb:396`), which is exactly why they
still reach the delegate.

trails' `DelegateClass` (`packages/ruby-compat/src/delegate.ts`) stops its walk
before `Object.prototype` and generates no `toString` forwarder. A
`DelegateClass(String)` instance therefore throws
`String.prototype.toString requires that 'this' be a String` from `String(x)`, and
`JSON.stringify` renders it as an object, not as the wrapped string.

Surfaced by trails#7763, which rebuilt `ActiveRecord::Core::InspectionMask < DelegateClass(::String)`
(`activerecord/lib/active_record/core.rb:858-863`) on it and had to work around the gap:

- `packages/activerecord/src/attribute-methods.ts` `formatForInspect` calls
  `String(filtered.__getobj__())` instead of the mask's `to_s`.
- `packages/activerecord/src/log-subscriber.ts` `unwrapDelegator` unwraps
  String delegators before `JSON.stringify`, which stands in for Rails' `binds.inspect`
  (`log_subscriber.rb:49`).

## Acceptance criteria

- `DelegateClass` instances forward `toString` (Ruby `to_s`) and `inspect` to
  `__getobj__`, as `delegate.rb:44-49` does via `method_missing`.
- `String(new (DelegateClass(String))("x"))` is `"x"`.
- `formatForInspect` goes back to Rails' shape (returns the `filter_param` result), and
  `unwrapDelegator` in `log-subscriber.ts` is deleted, with
  `BindParameterTest > binds with filtered attributes` still green.
