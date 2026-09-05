---
title: "Railtie's abstract raise interpolates the JS leaf name where Rails uses the Ruby constant path"
status: draft
updated: 2026-09-05
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Railtie#initialize` raises with the Ruby constant path
(`vendor/rails/railties/lib/rails/railtie.rb:245-247`):

```ruby
def initialize # :nodoc:
  if self.class.abstract_railtie?
    raise "#{self.class.name} is abstract, you cannot instantiate it directly."
  end
end
```

`self.class.name` is the fully-qualified constant — `Rails::Engine`,
`Rails::Application` — so the message reads
`Rails::Engine is abstract, you cannot instantiate it directly.`

`packages/trailties/src/trailtie.ts:41` interpolates `klass.name`, the JS class
name, which is the bare leaf: `Engine`, `Application`. The message text is
otherwise byte-identical, so this is purely the interpolated value.

trailties already carries the Ruby constant path for exactly this purpose —
`getRubyClassPath` from `./ruby-class-path-slot.js`, imported into this same
file at `trailtie.ts:6` and used by `isAbstractRailtie`'s
`ABSTRACT_RAILTIES` lookup (`trailtie.ts:8`, the list of Ruby paths
`Rails::Railtie` / `Rails::Engine` / `Rails::Application`). So the guard already
resolves the Ruby path one line above the raise, and then throws away that
spelling when building the message.

Surfaced in #7502, which converged the error _class_ at this site (bare `raise`
→ `RuntimeError`) but left the message value alone, its story having scoped
message strings as unchanged.

## Converged shape

Interpolate the Ruby constant path — the value `isAbstractRailtie` already
matched against — rather than `klass.name`, so the message reads
`Rails::Engine is abstract, you cannot instantiate it directly.`

Check `trailtie/configurable.ts:26`'s
`You cannot inherit from a ${parent.name} child` at the same time
(`railties/lib/rails/railtie/configurable.rb:14` interpolates
`superclass.name`); it has the same leaf-vs-path gap, though it is guarded by a
separate pre-existing `@noRailsEquivalent CONVERGEABLE` receipt for the
`inherited`-hook deviation and may need that resolved first.

## Acceptance criteria

- [ ] `new (Rails::Engine)()` raises a message naming `Rails::Engine`, not
      `Engine`.
- [ ] The rest of the message string is unchanged.
- [ ] Existing `RailtieTest` case names unchanged.
