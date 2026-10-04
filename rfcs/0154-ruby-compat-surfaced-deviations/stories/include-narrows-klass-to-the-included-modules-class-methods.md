---
title: "ruby-compat: include() narrows klass so SetupAndTeardown.prepended calls klass.defineCallbacks with no cast"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8463. `SetupAndTeardown.prepended`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/setup_and_teardown.rb:21-25`) is

    klass.include ActiveSupport::Callbacks
    klass.define_callbacks :setup, :teardown
    klass.extend ClassMethods

The port in `packages/activesupport/src/testing/setup-and-teardown.ts` keeps one
receiver cast on the second line:

    include(klass, Callbacks);
    (klass as typeof klass & Extended<typeof Callbacks.ClassMethods>).defineCallbacks("setup", "teardown");

because ruby-compat's `include(klass, mod): void` (`packages/ruby-compat/src/include.ts`)
does not change the static type of `klass`, so the class methods the module's
included hook extends are invisible after the call. `no-freeform-comments`
rejects a call-site comment, so the cast carries no justification in the code.

Two alternatives were checked in that PR and neither drops the cast:
`Callbacks.ClassMethods.defineCallbacks.call(klass, ...)` is typed
`this: CallbacksClass` (file-local in `callbacks.ts`), and the free
`defineCallbacks(target, name, options)` helper takes one name and re-runs
`include`.

The converged shape is `klass.defineCallbacks("setup", "teardown")` with no
cast, after `include(klass, Callbacks)`.

## Acceptance criteria

- [ ] `prepended` in `testing/setup-and-teardown.ts` calls `klass.defineCallbacks("setup", "teardown")` with no cast, as `setup_and_teardown.rb:23` does.
- [ ] The mechanism is general: either `include()` / `extend()` gain an `asserts klass is ...` signature that narrows to the included module's class methods, or the story is blocked with the specific TypeScript limit that rules that out (an assertion signature narrows only to a subtype of the declared parameter type).
- [ ] Other `include(klass, X)` call sites followed by a cast to reach X's members are listed and converged or filed.
