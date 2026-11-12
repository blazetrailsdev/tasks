---
title: "active_record.initialize_database reads Rails.application.config.database_configuration, not a cwd-relative lookup"
status: draft
updated: 2026-11-12
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `active_record.initialize_database` initializer is
`self.configurations = Rails.application.config.database_configuration`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:254-258`).
`Rails::Application::Configuration#database_configuration`
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:434-462`)
resolves `paths["config/database"].existent.first` against the application's
root.

trails' railtie (`packages/trailties/lib/trailties/active-record.ts:313-317`)
calls the free function `databaseConfiguration()` from
`packages/trailties/lib/database.ts:96`. That function resolves
`root ?? trailsRoot() ?? fs.cwd()`, and `trailsRoot()` is seated only by
`Application#initializeBang` (`packages/trailties/lib/application.ts:310`).
Any boot that runs the initializers without `initializeBang` reads
`config/database` relative to the process cwd. `trails-tsc-views
build-autoload --cwd <app>` hit this, and trails#10040 worked around it by
having `buildAutoload` seat `trailsRoot()` itself.
`Configuration#databaseConfiguration` is not ported on
`packages/trailties/lib/application/configuration.ts`.

Related, not a duplicate: `database-configuration-reads-config-database-yml`
covers the YAML arm and the `.ts` / `.js` / `.json` receipts, not this call
path.

## Acceptance criteria

- `Configuration#databaseConfiguration` is ported on the application
  configuration at its Rails name and with its Rails control flow
  (`paths().get("config/database")`, the `existent.first` lookup, and the
  `DATABASE_URL` arm and raise).
- `active_record.initialize_database` calls
  `Trails.application.config.databaseConfiguration()`, as Rails does.
- The cwd fallback in `database.ts` is gone, along with `build-autoload`'s
  `setTrailsRoot` workaround, if nothing else needs it.
- A test boots from a cwd other than the application root and loads the
  application's `config/database`.
