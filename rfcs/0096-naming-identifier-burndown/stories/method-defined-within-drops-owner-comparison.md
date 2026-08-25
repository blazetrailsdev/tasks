---
title: "method_defined_within? drops Rails' owner comparison when both classes define the name"
status: done
updated: 2026-08-19
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6730
claim: "2026-08-18T23:11:21Z"
assignee: "order-check-ignores-suppressed-call-claims"
blocked-by: null
closed-reason: null
---

# `method_defined_within?` drops Rails' owner comparison when both classes define the name

## Context

Surfaced in PR #6720 while restoring both arms of
`instance_method_already_implemented?`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:165-179`),
which is the predicate's only caller in that body.

Rails (`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:187-198`):

```ruby
def method_defined_within?(name, klass, superklass = klass.superclass)
  if klass.method_defined?(name) || klass.private_method_defined?(name)
    if superklass.method_defined?(name) || superklass.private_method_defined?(name)
      klass.instance_method(name).owner != superklass.instance_method(name).owner
    else
      true
    end
  else
    false
  end
end
```

trails (`packages/activerecord/src/attribute-methods.ts`, `isMethodDefinedWithin`):

```ts
if (!(name in klass.prototype)) return false;
if (!superklass) return true;
return !(name in superklass.prototype);
```

The inner branch is inverted in meaning: where BOTH `klass` and `superklass`
respond to `name`, Rails compares OWNERS and answers `true` when `klass`
redefines it, while trails answers a flat `false`. trails only reproduces
Rails' `else true` arm (superklass does not define it) and the outer `false`
arm. So a name defined on both — the exact case the owner comparison exists
for — is reported as NOT defined within `klass`.

`||  private_method_defined?` is also dropped; JS has no private-method
reflection over the prototype chain, so the `in` test already covers both
Ruby visibilities and that half is not a divergence.

## Converged shape

Compare owners as Rails does. PR #6720 added a module-private
`isOwnedByGeneratedAttributeMethods` in the same file that already walks the
prototype chain to find the object owning a name (`include()` splices a
module's carrier directly below the including class's own prototype); the same
walk answers "which prototype owns `name`", so the owner comparison is
`ownerOf(klass, name) !== ownerOf(superklass, name)` over that helper rather
than new machinery.

Note the current caller passes `superklass = Base` explicitly, and attribute
methods are not normally on `Base.prototype`, so the wrong arm is rarely
reached today — this is a latent divergence, not a live bug, and the
regression test needs a name defined on both `klass` and `Base`.

## Acceptance criteria

- [ ] `isMethodDefinedWithin` reproduces all three Rails arms, including the
      owner comparison when both classes define the name.
- [ ] The Ruby default `superklass = klass.superclass` is honoured when the
      argument is absent (trails currently returns `true` in that case).
- [ ] A test covers the both-define case in both directions (klass redefines →
      true; klass inherits it unchanged → false), failing on the baseline.
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
