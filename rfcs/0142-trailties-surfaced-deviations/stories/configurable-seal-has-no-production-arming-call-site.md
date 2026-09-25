---
title: "Railtie::Configurable's inheritance seal is never armed outside tests, so the raise is inert in a booted app"
status: closed
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: "boot"
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 30
pr: null
claim: "2026-09-25T02:09:41Z"
assignee: "converge-config-target-version-to-two-arms"
blocked-by: null
closed-reason: "Premise falsified by vendor/rails: Rails::Railtie::Configurable (railtie/configurable.rb) is included/extended nowhere in railties — railtie.rb:187-189 says the module is no longer required for Railtie subclasses and Engine/Application do not extend it. Rails arms the seal only when a user explicitly extends Configurable, so trails having no production sealAgainstInheritance call site is faithful."
---

## Context

`Rails::Railtie::Configurable` raises when anything subclasses a class that has
extended it:

```ruby
module ClassMethods
  delegate :config, to: :instance

  def inherited(base)
    raise "You cannot inherit from a #{superclass.name} child"
  end
```

(`vendor/rails/railties/lib/rails/railtie/configurable.rb:10-15`)

In Ruby the seal is armed by `extend Railtie::Configurable`, which
`Rails::Engine` and `Rails::Application` subclasses pick up, so a real app hits
the raise the moment it subclasses a concrete engine.

trails ports the raise faithfully — `assertNotSealed` in
`packages/trailties/src/trailtie/configurable.ts:23-33`, called from
`Trailtie.register` (`trailtie.ts:59`) because JS has no `inherited` hook
(CLAUDE.md, "Module mixins"; its existing `@noRailsEquivalent CONVERGEABLE`
receipt covers that deferral). But **nothing in `packages/trailties/src/**`ever
calls`sealAgainstInheritance`** — the arming half. A repo-wide grep finds call
sites only in `trailtie.test.ts:141,149`. So the seal is exercised by its own
tests and is inert in a booted app: a user subclassing a concrete Engine gets no
raise where Rails raises.

Surfaced in #7629, which converged the raise's interpolated value to the Ruby
constant path (`superclass.name`) and, in doing so, found the arming path absent.

## Converged shape

Arm the seal where Ruby's `extend Railtie::Configurable` arms it. Establish which
classes Rails actually seals — `railtie/configurable.rb:7`'s
`extend ActiveSupport::Concern`, and the `include`/`extend` sites in
`engine.rb` and `application.rb` — then call `sealAgainstInheritance` from the
trails counterpart of each, so the production path reaches the raise rather than
only the tests.

Note the arity difference worth pinning while you are there: Ruby's `inherited`
fires on the DIRECT parent only, so Rails raises when a sealed class's immediate
child is defined; trails' `assertNotSealed` walks the whole prototype chain at
`register` time. Same message, different trigger point — confirm the walk is
still the right deferral once the arming path exists.

## Acceptance criteria

- [ ] `sealAgainstInheritance` has at least one production call site in
      `packages/trailties/src/**`, arming the seal on the classes
      `railtie/configurable.rb` arms it on.
- [ ] A test defines a subclass of a sealed concrete Engine/Application through
      the normal registration path and asserts the
      `"You cannot inherit from a ... child"` raise.
- [ ] Existing `trailtie.test.ts` case names unchanged.
