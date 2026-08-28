---
title: "Make extend() honor Ruby's class-body-over-ClassMethods precedence"
status: in-progress
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 7151
claim: "2026-08-28T11:34:53Z"
assignee: "honor-class-body-precedence-in-extend"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `include SomeModule` puts `SomeModule::ClassMethods` on the includer's
singleton ancestry BELOW the class body, so a `def self.x` written in the class
wins over the module's `x` (concern.rb:137 extends, it does not overwrite).

trails' `extend()` (`packages/activesupport/src/include.ts:362-383`) copies
unconditionally: every key in the module object is `Object.defineProperty`'d onto
the class, clobbering a class-body static of the same name. Its sibling
`include()` already gets this right — it tracks `installed` keys and leaves an
untracked own property (i.e. a class-body method) alone (`include.ts:227-262`).

PR #7134 hit this wiring `ActiveRecord::Base`: `include(Base, AttributeRegistration)`
(base.rb:311) would have clobbered `Base`'s own `attribute`, `typeForAttribute`
and `hookAttributeType` class-body statics, so the PR captures them into a
`BaseAttributeRegistrationOverrides` const before the include and re-applies them
after. That block is a workaround for the `extend()` gap, not something Rails
has, and it is a trap for the next `extend()` added to `base.ts`.

Rails source: `activesupport/lib/active_support/concern.rb:135-138`
(`append_features` → `base.extend const_get(:ClassMethods)`), and Ruby's own
singleton method lookup.

## Acceptance criteria

- `extend()` mirrors `include()`'s precedence: an own property on the target that
  `extend()` did not itself install (a class-body `static`) is not overwritten;
  a key installed by an earlier `extend()` still loses to a later one, as Ruby's
  later-include-wins ancestry does.
- `BaseAttributeRegistrationOverrides` in `packages/activerecord/src/base.ts` and
  its capture/re-apply pair are deleted; `Base`'s class-body `attribute`,
  `typeForAttribute` and `hookAttributeType` keep winning with no help.
- Accessor-pair handling matches `include()`'s (`include.ts:240-255`), so a
  getter from a class module and a setter from the class body still merge.
- Sweep for other capture-and-reapply shapes around `extend()` calls and delete
  the ones this makes redundant.
- activesupport + activemodel + activerecord suites green; `parity:api:calls`
  and `parity:api:extra:gate` clean.
