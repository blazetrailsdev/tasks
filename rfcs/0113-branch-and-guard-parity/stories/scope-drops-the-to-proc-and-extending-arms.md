---
title: "scope-drops-the-to-proc-and-extending-arms"
status: in-progress
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 6
pr: 7389
claim: "2026-09-02T13:34:18Z"
assignee: "param-name-check-pairs-nested-class-constructor-with-enclosing-initialize"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Scoping::Named::ClassMethods#scope`
(`vendor/rails/activerecord/lib/active_record/scoping/named.rb:154-`) branches
twice after its three raises:

```ruby
extension = Module.new(&block) if block

if body.respond_to?(:to_proc)
  singleton_class.define_method(name) do |*args|
    scope = all._exec_scope(*args, &body)
    scope = scope.extending(extension) if extension
    scope
  end
else
  singleton_class.define_method(name) do |*args|
    scope = body.call(*args) || all
    scope = scope.extending(extension) if extension
    scope
  end
end
```

`packages/activerecord/src/scoping/named.ts#scope` keeps the three raises and
then diverges: it registers into a `_scopes` Map and defines a forwarding
property, with no `to_proc` arm, no `extending(extension)` arm, and no
`body.call(...) || all` fallback. The arms skeleton reports two missing `if`s.

Behaviourally: a scope body returning nil does not fall back to `all`, and a
scope extension is stored in a parallel `_scopeExtensions` map rather than being
applied via `extending`.

Surfaced by the RFC 0113 noise-floor audit (row 80 of the seed-113 sample,
`docs/infrastructure/arm-mismatch-noise-floor.md`), classified `real`. Note the
port's `_scopes` / `_scopeExtensions` registry is itself surface Rails does not
have; converging the arms may retire it.

## Converged shape

Define the singleton method Rails defines, with both arms: `_exec_scope` for a
proc-like body, `body.call(...) ?? all()` otherwise, and the
`scope = scope.extending(extension)` arm under an extension.

## Acceptance criteria

- [ ] A scope body returning null resolves to `all()`, per Rails' `|| all`.
- [ ] An extension is applied through `extending`, not a side registry.
- [ ] Tests carry the Rails test names from `scoping/named_scoping_test.rb`
      that cover both arms.
- [ ] The row leaves `pnpm parity:api:arms:report`.
