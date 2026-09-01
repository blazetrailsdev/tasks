---
title: "port-railties-initializers-ordering"
status: claimed
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 44
pr: null
claim: "2026-09-01T17:23:54Z"
assignee: "scopes-are-untyped-on-relation"
blocked-by: null
closed-reason: null
---

## Context

`Application#initializers` (`packages/trailties/src/application.ts`)
splices `Bootstrap.initializersFor(this).plus(super.initializers)
.plus(Finisher.initializersFor(this))`, but Rails wraps the inherited
collection in `railties_initializers(super)`
(`vendor/rails/railties/lib/rails/application.rb:445-449`):

```ruby
def initializers
  Bootstrap.initializers_for(self) +
  railties_initializers(super) +
  Finisher.initializers_for(self)
end
```

`railties_initializers` (application.rb:614-624) walks
`ordered_railties.reverse.flatten` so `config.railties_order` decides where
each engine's initializers land relative to the app's own. Neither
`railties_initializers` nor `ordered_railties` (application.rb:588-612) is
ported, so the inherited collection is spliced in load order and
`config.railtiesOrder` is inert. The gap is marked with a
`@missingRailsCall railties_initializers` tag on `Application#initializers`.

## Acceptance criteria

- `ordered_railties` and `railties_initializers` are ported with the Rails
  names and bodies, and `Application#initializers` calls
  `railtiesInitializers(super.initializers)`.
- `config.railtiesOrder` (including the `:all` placeholder) reorders engine
  initializers as in Rails.
- The `@missingRailsCall railties_initializers` tag is deleted.
- Tests mirror the Rails `railties_order` cases.
