---
title: "railtie-class-body-statements-dropped-in-port"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two framework railtie class bodies drop statements Rails writes in them. Both
surfaced while inlining their invented statics in PR #7503
(`invented-statics-on-the-moved-framework-railties`), which converged the
`initializer` blocks but left the class-body statements around them alone.

**ActiveModel** — `activemodel/lib/active_model/railtie.rb:8` is
`config.eager_load_namespaces << ActiveModel`, the first line of the class body.
`packages/trailties/src/trailties/active-model.ts` has no
`this.config.eagerLoadNamespaces.push(...)` at all, where its siblings do
(`global-id.ts` pushes `GlobalID`, mirroring `vendor/globalid/lib/global_id/railtie.rb:14`).

**GlobalID** — `vendor/globalid/lib/global_id/railtie.rb:35-38`, inside the
`initializer 'global_id'` block:

```ruby
ActiveSupport.on_load(:active_record) do
  require 'global_id/identification'
  send :include, GlobalID::Identification
end
```

`packages/trailties/src/trailties/global-id.ts` ports the sibling
`on_load(:active_record_fixture_set)` hook at `:40-43` but not this one, so
`GlobalID::Identification` — which is what gives a model `to_global_id` /
`to_gid` / `to_sgid` — is never mixed into `Base`.

## Converged shape

- `active-model.ts`'s class body opens with
  `this.config.eagerLoadNamespaces.push(ActiveModel);`, matching `railtie.rb:8`
  and the shape `global-id.ts` already uses.
- `global-id.ts`'s `initializer("global_id")` gains the
  `onLoad("active_record", ...)` arm that includes `Identification`, placed
  before the `active_record_fixture_set` arm as in Ruby. Check whether
  `GlobalID::Identification` is ported in `packages/globalid/src/` first; if it
  is not, that port is the bulk of the work and this story sizes accordingly.

## Acceptance criteria

- [ ] `railtie.rb:8`'s eager-load push is present in `active-model.ts`.
- [ ] A model reachable through a booted app answers `toGlobalId()`, covering
      `railtie.rb:35-38`.
- [ ] `pnpm parity:api:calls` does not regress.
