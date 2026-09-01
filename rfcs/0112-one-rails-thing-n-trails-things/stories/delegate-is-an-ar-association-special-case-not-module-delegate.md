---
title: "delegate.ts's generated body is an ActiveRecord association special case, not Rails' Module#delegate"
status: draft
updated: 2026-09-01
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `delegate.ts`'s generated body is an ActiveRecord association special case, not Rails' delegation

## Context

Rails' `Module#delegate`
(`activesupport/lib/active_support/core_ext/module/delegation.rb:160-170`) is a
generic ActiveSupport method: it hands off to `ActiveSupport::Delegation.generate`
(`activesupport/lib/active_support/delegation.rb:21-148`), which emits

```ruby
def #{method_name}(#{definition})
  _ = #{receiver}
  _.#{method}(#{definition})
rescue NoMethodError => e
  if _.nil? && e.name == :#{method}
    raise ::ActiveSupport::DelegationError.nil_target(:#{method_name}, :'#{receiver}')
  ...
```

trails' `delegate` (`packages/activerecord/src/delegate.ts`) is a different thing
wearing the same name, and diverges on five counts:

1. **It is an ActiveRecord function, not `Module#delegate`.** Signature is
   `delegate(modelClass, methods, options)`; Rails' is a `Module` instance method
   with `*methods` and the `to:` kwarg. It lives in `activerecord`, not
   `activesupport`.
2. **The target must be an association.** The body resolves
   `association(assocName)` and only loads a target when
   `reflection.macro` is `"belongsTo"` or `"hasOne"`. Rails' `to:` is any method,
   ivar, constant or module — `delegate :size, to: :@items` is legal and
   trails cannot express it.
3. **A nil target returns `null` instead of raising.** Rails raises
   `ActiveSupport::DelegationError` unless `allow_nil: true`
   (`delegation.rb:207-209`, `delegation.rb:128-141`); trails' `if (!target) return null;`
   is unconditional `allow_nil` semantics, and the `allowNil` option is not
   implemented at all.
4. **Arguments are dropped.** The generated function takes no parameters and
   calls `target[method]()` with none. Rails forwards the target method's real
   parameter list (`delegation.rb:82-105`).
5. **It falls back to `readAttribute`.** `return target.readAttribute(method)`
   when the target has no such function — Rails would raise `NoMethodError`.

Surfaced while fixing the bare-`Error` guard in PR #7337
([[delegate-missing-reflection-raises-bare-error]]).

## Converged shape

`delegate` moves to `@blazetrails/activesupport` as the port of `Module#delegate`
/ `ActiveSupport::Delegation.generate`, keyed on an arbitrary receiver rather than
an association, forwarding arguments, honouring `allowNil`, raising
`DelegationError` on a nil target otherwise, and with no `readAttribute` fallback.
The three `it.skip`ped tests in `delegate.trails.test.ts` are unskipped or
replaced by ports of Rails' `activesupport/test/core_ext/module_test.rb` delegation
tests.

Sizeable — split at the reviewer's discretion, but note the `allowNil` /
`DelegationError` arm (3) is the behavioural one and can ship alone.

## Acceptance criteria

- [ ] A nil delegation target raises `DelegationError` unless `allowNil` is set.
- [ ] `allowNil` is implemented.
- [ ] Delegated methods forward their arguments.
- [ ] The `readAttribute` fallback is gone.
- [ ] `to:` accepts a non-association receiver.
- [ ] `delegate.trails.test.ts` has no `it.skip`.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
