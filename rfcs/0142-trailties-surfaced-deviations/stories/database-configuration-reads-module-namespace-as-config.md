---
title: "databaseConfiguration reads the module namespace as config (ConfigurationFile.parse answers {})"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Configuration#databaseConfiguration`
(`packages/trailties/lib/application/configuration.ts:597-599`) reads the
config module as `mod.default ?? mod`, so a blank or default-less
`config/database.ts` hands the ES module namespace object (with its
`Symbol.toStringTag`) to the shared-key merge as if it were the parsed hash.
Rails reads it through `ActiveSupport::ConfigurationFile.parse(yaml)`
(`vendor/rails/v8.0.5.2/railties/lib/rails/application/configuration.rb:439`),
which answers `{}` for a blank file
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/configuration_file.rb`,
`YAML.load(...) || {}`).

trails#10584 converged the sibling `loadDatabaseYaml` (`:645-664`) to
`mod.default ?? {}`; `databaseConfiguration` still carries the invented arm.

## Acceptance criteria

- [ ] `databaseConfiguration` reads `mod.default ?? {}`, as `ConfigurationFile.parse` answers `{}`.
- [ ] A test with a blank `config/database.ts` asserts `databaseConfiguration()` is `{}`; it fails on the old code.
