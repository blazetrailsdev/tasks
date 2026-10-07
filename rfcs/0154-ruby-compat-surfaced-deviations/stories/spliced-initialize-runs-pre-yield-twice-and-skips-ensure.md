---
title: "ruby-compat: a spliced module initialize runs its pre-yield code twice and skips an ensure around super"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8638 added `spliceInstanceInitializer` to `packages/ruby-compat/src/include.ts`: `include()` splices a class module's generator `initialize` between the includer and its superclass, where `rb_include_module` (`vendor/ruby/v3.3.11/class.c:1179`) puts the module, so `ActiveRecord::Type::Internal::Timezone#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/internal/timezone.rb:7-10`) wraps its includer's construction.

A JS constructor has no `this` until `super(...)` returns and a generator cannot be resumed against a different `this`, so the link calls the generator twice: once with `this` undefined, advanced to its `yield` to read `super`'s arguments, and once against the instance after the superclass constructor returns. Two behaviours differ from Ruby, where `initialize` runs once:

- **The code before the `yield` runs twice per construction.** A side effect there (mutating an argument, a counter, a log line) fires twice. `Timezone`'s is pure destructuring, so nothing observes it today.
- **An `ensure` around `super` does not run when the superclass constructor raises.** The first generator is abandoned at its `yield` rather than closed, so a `finally` around the `yield` never runs. The root-site path (`initializeIncludedModules`) does close its generators (`body.return(undefined)`), and its test "closes a generator initializer when an initializer beneath it raises" pins that. The spliced path's test pins only that the code after the `yield` is skipped.

## Acceptance criteria

- [ ] When the superclass constructor raises, a `finally` around a spliced initializer's `yield` runs, as an `ensure` around `super` does, and a test in `packages/ruby-compat/src/include.test.ts` pins it.
- [ ] The code before a spliced initializer's `yield` has its side effects observed once per construction, or the splice refuses (raises at include time or at construction) a body it cannot run that way; a test pins whichever is chosen.
- [ ] The JSDoc on the exported `initialize` symbol states the resulting contract.
- [ ] `packages/activerecord/src/type/` tests stay green.
