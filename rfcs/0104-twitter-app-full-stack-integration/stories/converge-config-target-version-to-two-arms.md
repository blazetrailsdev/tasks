---
title: "converge-config-target-version-to-two-arms"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AppGenerator#configTargetVersion`
(`packages/trailties/src/generators/app-generator.ts`, added in #7349) returns
the string literal `"8.0"`. Rails' is

```ruby
# vendor/rails/railties/lib/rails/generators/rails/app/app_generator.rb:261-263
def config_target_version
  @config_target_version || Rails::VERSION::STRING.to_f
end
```

Two divergences, both real:

1. The `@config_target_version` arm is missing entirely. In Rails it is set by
   `app:update` (`app_generator.rb`'s `AppUpdateGenerator`) so a regenerated
   `config/application.rb` keeps the version the app was BORN with rather than
   silently adopting the current one. trails has no writer, so a future
   `trails app:update` would clobber the app's pinned defaults.
2. The fallback is a literal, not `VERSION`. `packages/trailties/src/version.ts`
   is `"0.1.0"`, which is not a `loadDefaults` branch — passing it would raise
   `Unknown version "0.1"`. The literal is the honest stand-in for now, but it
   means the generated app's `config.loadDefaults` does not track the Rails
   release this port targets when that release moves; nothing fails loudly.

## Converged shape

Give `Configuration` the notion of the newest `loadDefaults` branch it
implements — Rails gets this for free because its own version IS that branch —
and have `configTargetVersion` read it, with the `@config_target_version`
instance-variable arm in front of it as Rails has. The point is that adding an
`"8.1"` case to `loadDefaults` should move the generated app forward without
a second edit in the generator.

## Acceptance criteria

- `configTargetVersion` has both arms in Rails' order.
- Adding a `loadDefaults` version branch moves the generated
  `config.loadDefaults(...)` without touching `app-generator.ts`.
- The generator snapshot is updated.
