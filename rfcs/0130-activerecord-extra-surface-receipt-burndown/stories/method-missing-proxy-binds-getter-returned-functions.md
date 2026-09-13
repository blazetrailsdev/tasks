---
title: "methodMissingProxy binds getter-returned functions; converge ReflectionProxy onto it"
status: draft
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`methodMissingProxy` (`packages/ruby-compat/src/method-missing-proxy.ts`) forwards a missing name to the delegate and, whenever the value read is a function, returns `value.bind(delegate)`. So a delegate **getter** that returns a class (for example `AssociationReflection#klass`) comes back as a bound copy of the class, not the class itself. Ruby's `Delegator#method_missing` (`vendor/ruby/lib/delegate.rb:82-93`) forwards the call `target.__send__(m, *args, &block)`, which returns the reader's value unchanged.

Surfaced by trails#7733: `ReflectionProxy < SimpleDelegator` (`activerecord/lib/active_record/associations/association_scope.rb:101`) could not use `methodMissingProxy`, because `proxy.klass` failed `toBe(AsPost)`. It hand-rolls a Proxy that binds only data-descriptor methods (`packages/activerecord/src/associations/association-scope.ts`, `ReflectionProxy` constructor).

## Acceptance criteria

- `methodMissingProxy` binds a function only when the name resolves to a method (a data descriptor on the delegate's prototype chain); a getter's return value passes through unbound.
- `ReflectionProxy` uses `methodMissingProxy` (or a ported `SimpleDelegator`) and its hand-rolled Proxy is deleted.
- A ruby-compat unit test covers a getter returning a class.
