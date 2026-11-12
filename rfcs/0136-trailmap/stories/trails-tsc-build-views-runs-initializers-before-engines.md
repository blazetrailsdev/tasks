---
title: "trails-tsc build-views loads config/initializers without running engine initializers"
status: done
updated: 2026-11-12
rfc: "0136-trailmap"
cluster: null
packages: ["trails-tsc", "activestorage"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10009
claim: "2026-11-11T21:41:20Z"
assignee: "trails-tsc-build-views-runs-initializers-before-engines"
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc` builds views (`packages/trails-tsc/lib/build-views.ts`) by
importing `config/application` and then `rbFLoad`-ing every file under
`config/initializers` by hand. It never runs the application's framework
initializers, so nothing an engine installs through `onLoad("active_record")`
exists yet when an initializer reaches a model.

Found by trailmap-audits-to-activestorage. With `@blazetrails/activestorage`
a dependency, `config/initializers/hub-database.ts` imports
`lib/model-schemas.ts`, which imports `app/models/audit.ts`, whose static
block calls `this.hasOneAttached("report")`. Under vitest and `bin/trails`
the app is initialized first and it works; under `pnpm build` it dies with

    trails-tsc: this.hasOneAttached is not a function

because `active_storage.attached` (the engine initializer that includes
`ActiveStorage::Attached::Model` into `ActiveRecord::Base`) never ran. Rails
runs `load_config_initializers` after every engine's initializers, so the same
model and initializer load fine in Rails.

Trails main (2a1618e1bf) has the same code; the vendored a7270c9 build too.

## Acceptance criteria

- `trails-tsc` view builds load initializers in the order Rails runs them:
  after the framework and engine initializers (e.g. by initializing the
  application rather than loading `config/initializers` by hand).
- A test in trails-tsc: an app with `@blazetrails/activestorage`, an
  initializer that imports a model calling `hasOneAttached`, builds its views.
- trailmap-audits-to-activestorage unblocked once trailmap vendors the fix.
