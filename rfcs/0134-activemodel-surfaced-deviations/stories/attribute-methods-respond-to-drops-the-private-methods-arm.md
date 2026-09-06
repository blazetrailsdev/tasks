---
title: "AttributeMethods#respondTo drops Rails' private-methods arm"
status: draft
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
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

Surfaced in #7552, which gave `AttributeMethods#respondTo` its `super`
(`basicObjRespondTo` in `packages/ruby-compat/src/object.ts`, Ruby's
`basic_obj_respond_to`, `vendor/ruby/vm_method.c:2864`) and retired its
`@missingRailsCall super — PERMANENT`.

Rails has three arms
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:527-537`):

```ruby
def respond_to?(method, include_private_methods = false)
  if super
    true
  elsif !include_private_methods && super(method, true)
    # found among all methods but not among non-private ones
    false
  else
    !matched_attribute_method(method.to_s).nil?
  end
end
```

trails (`packages/activemodel/src/attribute-methods.ts:484-495`) ports the
first and third and opens with `void includePrivateMethods;` — the middle arm,
which answers `false` for a name that exists only as a private method, is
dropped, so a private-only name falls through to the attribute-method lookup
instead of being reported as not-responded-to.

The parameter is also inert at every call site: `rbObjRespondTo`
(`vm_method.c:2934`) forwards `priv` faithfully, but this override discards it.

## Converged shape

Establish first whether the middle arm has a JS seat at all. `basicObjRespondTo`
is `mid in Object(obj)`, which sees every enumerable and non-enumerable string
key alike and has no notion of Ruby privacy — but trails DOES have two carriers
a Ruby private method maps onto: a `#private` field / TS `private` member (not
reachable through `in`, so already invisible to both `super` calls) and a
symbol-keyed member. If neither can distinguish "found among all, not among
public", the honest close is a `@missingRailsCall` receipt naming the arm and
the language shortcoming — but that is a finding to establish, not to assume,
and the `void includePrivateMethods;` line is not it.

## Acceptance criteria

- [ ] `respondTo` either ports the middle arm or carries a receipt at the call
      site naming what JS cannot express, cited to attribute_methods.rb:530-533.
- [ ] `includePrivateMethods` is read rather than voided, or the receipt says why.
- [ ] `attribute-methods.test.ts` stays green.
