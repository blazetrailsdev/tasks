---
title: "databaseConfiguration() does not port the shared-key reverse-merge"
status: done
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6782
claim: "2026-08-20T18:15:06Z"
assignee: "converge-assign-attribute-writer-ladder-onto-public-send"
blocked-by: null
closed-reason: null
---

## Context

`databaseConfiguration()` in `packages/trailties/src/database.ts` is trails'
seat for `Rails::Application::Configuration#database_configuration`
(`vendor/rails/railties/lib/rails/application/configuration.rb:434-468`). It was
added by PR #6777, which moved the `config/database.*` loading out of
`establishConnection` (where Rails never does it) onto the boot seam the Railtie
uses (`vendor/rails/activerecord/lib/active_record/railtie.rb:256-262`).

One branch of the Rails method is not ported: the `shared` key.
`configuration.rb:439-458` deletes `"shared"` from the loaded config and
reverse-merges it into every environment — with a nested arm when both the env
config and `shared` are hashes-of-hashes (multi-database), and a flat arm
otherwise — then returns `Hash.new(shared).merge(loaded_yaml)`, so an
_unlisted_ environment still resolves to `shared`.

trails' `databaseConfiguration()` returns the loaded module verbatim, so a
`shared:` key would be treated as an environment name.

The `Hash.new(shared)` default-value receiver has no direct JS equivalent; the
lookup that consumes it is `DatabaseConfigurations.fromEnv`, so the settled
shape is likely to materialize the default into the returned record rather than
model a defaulting Hash.

## Acceptance criteria

- `databaseConfiguration()` deletes a `shared` key and reverse-merges it per
  configuration.rb:439-458, including the hash-of-hashes arm.
- An environment absent from the config file but present via `shared` resolves,
  matching `Hash.new(shared).merge(loaded_yaml)`.
- The deviation note in `databaseConfiguration()`'s JSDoc is deleted.
- `packages/trailties/src/database.test.ts` covers both arms.
