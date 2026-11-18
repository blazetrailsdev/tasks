---
title: "connectsTo in a model's class body raises: trailties assigns Base.configurations after an await in its on_load hook"
status: closed
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-17T23:21:33Z"
assignee: "connects-to-in-a-model-body-races-configurations"
blocked-by: null
closed-reason: 'FALSIFIED: no race. active_record.initialize_database runs (awaited) before load_config_initializers, and its onLoad fires synchronously because Base is already loaded, so configurations are assigned before any initializer-loaded model body. The error comes from writing: "hub" — a String, which DatabaseConfigurations#resolve (activerecord/lib/active_record/database_configurations.rb:177-181) treats as a raw URL config and raises InvalidConfigurationError in Rails too. A Ruby Symbol is ":hub" in trails (CLAUDE.md, Symbols); trailmap should write connectsTo({ database: { writing: ":hub" } }).'
---

## Context

Found by trailmap#155's review. An application's abstract model cannot name
its database with `connectsTo` in its class body:

```ts
export class Hub extends ApplicationRecord {
  static {
    this.abstractClass = true;
    this.connectsTo({ database: { writing: "hub" } });
  }
}
```

raises `ActiveRecord::DatabaseConfigurations::InvalidConfigurationError:
'{ test => hub }' is not a valid configuration. Expected a URL string or a
Hash.` at class load, in a booted application whose `config/database.ts`
declares `hub` for that environment.

trailties' `active_record.initialize_database` initializer assigns
`Base.configurations` inside an `onLoad` hook, after
`await Trails.application.config.databaseConfiguration()`
(`trailties/lib/trailties/active-record.ts`, around the
`base.configurations(...)` call). A model loaded by a config initializer runs
its static block before that await settles, so `connectsTo` resolves `"hub"`
against configurations that are not assigned yet. Rails' `on_load` block is
synchronous (railties/lib/rails/application/configuration.rb
`database_configuration`, activerecord/lib/active_record/railtie.rb
`initialize_database`), so `connects_to` in a model body always sees them.

trailmap works around it by assigning `connectionSpecificationName` by hand on
`Hub` and `StatsSync::StatsSyncRecord` (the value `establishConnection` would
give), so an unconnected hub raises `ConnectionNotDefined` instead of falling
through to `Base`'s pool.

## Acceptance criteria

- `Base.configurations` is assigned before any application model's class body
  can run under a booted application, so `connectsTo({ database: { writing:
"<name>" } })` in a static block resolves a `config/database.ts` key.
- A trailties test boots an app whose abstract model calls `connectsTo` in its
  class body, loaded from a config initializer, and asserts it connects to the
  named database.
- trailmap's hand-set `connectionSpecificationName` on `Hub` and
  `StatsSync::StatsSyncRecord` is replaced with `connectsTo` after the
  re-vendor.
