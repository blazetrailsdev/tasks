---
title: "scope_attributes? drops the respond_to?(:default_scope) clause (proc-based default_scope override unsupported)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `Scoping::Default::ClassMethods#scope_attributes?`
(`vendor/rails/activerecord/lib/active_record/scoping/default.rb:55-56`) is:

```ruby
def scope_attributes? # :nodoc:
  super || default_scopes.any? || respond_to?(:default_scope)
end
```

`super` is `Scoping::ClassMethods#scope_attributes?` (`current_scope` present).
The third clause — `respond_to?(:default_scope)` — is true when a model defines
a **`default_scope` instance/class method directly** (the proc/method form,
e.g. `def self.default_scope; where(...); end`) rather than registering via
`default_scope { … }` (which appends to `default_scopes`). Either form must make
`scope_attributes?` true so `new`/`create` seed the scope's attributes.

trails' equivalent (`packages/activerecord/src/base.ts:534`, mirroring
`Scoping::Default::ClassMethods#scope_attributes?`, with the base predicate
`isScopeAttributes` at `packages/activerecord/src/scoping.ts:144` returning
`!!this.currentScope`) implements `super || default_scopes.any?` but **drops the
`respond_to?(:default_scope)` clause** — a model that overrides `default_scope`
as a method instead of via the `default_scope { }` registry is not recognized as
scoped, so its default-scope attributes are not applied on build/create.

## Acceptance criteria

- [ ] The trails `scope_attributes?` equivalent (`base.ts:534`) includes the
      third clause: a model that defines a `default_scope` method (not just via
      the `default_scope { }` registry) reports `scope_attributes?` true,
      matching `default.rb:55-56`.
- [ ] `super`/`default_scopes.any?` behavior is unchanged.
- [ ] Read the Rails `scoping`/`default_scoping` test covering the
      method-form `default_scope` and mirror its name verbatim; add a regression
      test that `new`/`create` seeds the default-scope attributes for the
      method-form override.
- [ ] api:compare / test:compare delta non-negative.
