---
title: "Every method_missing trap skips KERNEL_METHODS, as Chars now does"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7984, which added `KERNEL_METHODS`
(`packages/ruby-compat/src/method-missing-proxy.ts`): the public methods `Kernel` defines
(`vendor/ruby/object.c:4360`, `Init_Object` at `:4527`). Ruby resolves those on the receiver
before `method_missing` runs, so a proxy must not forward them. Only `Chars`
(`packages/activesupport/src/multibyte/chars.ts`) consults it. The other `method_missing` mirrors
still forward a Kernel name to their delegate when the delegate answers it:
`methodMissingProxy` (`method-missing-proxy.ts:155`), `Delegation.generate_method_missing`'s trap
(`packages/activesupport/src/delegation.ts:180`, Rails
`activesupport/lib/active_support/delegation.rb`) and `Deprecation::Proxy`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts`). E.g. a `DelegateClass` wrapper's
`eql` / `hash` / `inspect` read the delegate's where Ruby's `Kernel#eql?` / `#hash` / `#inspect`
answer for the wrapper (`vendor/ruby/lib/delegate.rb` explicitly re-defines only `==`, `!=`,
`eql?`, `hash`, …; check each class's own list first).

## Converged shape

Every `method_missing` trap in the repo skips `KERNEL_METHODS` names the wrapper's Ruby class
does not re-define, exactly as `Chars`'s trap does, so those sends answer Kernel's behaviour.

## Acceptance criteria

- Each trap listed above consults `KERNEL_METHODS` before forwarding, minus the names its Rails
  / stdlib class re-defines (cite the `.rb` line for each exception).
- A trails test per wrapper asserts `rbEql(wrapper, delegate)` is false where Ruby's is.
