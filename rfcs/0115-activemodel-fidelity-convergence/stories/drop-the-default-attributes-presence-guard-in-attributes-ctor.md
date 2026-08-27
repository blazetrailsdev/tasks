---
title: "Drop the _defaultAttributes presence guard in Attributes' constructor"
status: draft
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Attributes#initialize` (activemodel/lib/active_model/attributes.rb:106-109)
has no conditional:

```ruby
def initialize(*) # :nodoc:
  @attributes = self.class._default_attributes.deep_dup
  super
end
```

`packages/activemodel/src/attributes.ts`'s `Attributes` class constructor guards
it instead:

```ts
const ctor = this.constructor as { _defaultAttributes?(): AttributeSet };
this._attributes = ctor._defaultAttributes
  ? ctor._defaultAttributes().deepDup()
  : new AttributeSet();
```

The guard existed because a bare `new Attributes()` had no class half installed.
PR #7134 removed that premise: `Attributes.[included]` now issues the whole mixin
contract (`include(base, AttributeRegistration)` → `_default_attributes` is
always on the host) and prepends the unguarded `initialize` free function onto
the host's `init_internals` chain, which is the path every real host takes.

There is currently no `class X extends Attributes` anywhere in `packages/`
(only `interface X extends Attributes` declaration merges, which carry no
constructor), so the class constructor — and with it the `: new AttributeSet()`
arm — is dead code that contradicts the Ruby it mirrors.

## Acceptance criteria

- The `_defaultAttributes ? … : new AttributeSet()` guard is gone; the remaining
  seeding matches `attributes.rb:107` with no conditional.
- Confirm whether the `Attributes` class constructor is reachable at all now
  that `[included]` prepends `initialize`; if it is not, delete it rather than
  un-guarding it, and say so at the call site.
- No host regresses: activemodel suite green, and the AR suites that construct
  through `include(Base, …)` stay green.
