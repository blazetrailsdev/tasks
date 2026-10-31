---
title: "Generators::Migration#create_migration goes through Thor::Actions#action"
status: claimed
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-31T17:30:45Z"
assignee: "rake-thread-pool-history"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Rails::Generators::Migration#create_migration` (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:35-37`) is an instance method of the generator:

```ruby
action Rails::Generators::Actions::CreateMigration.new(self, destination, block || data.to_s, config)
```

`Thor::Actions#action` chooses between `invoke!` and `revoke!` based on `behavior`.

trailties' `createMigration` (`packages/trailties/src/generators/migration.ts:28-35`) is instead a free function taking `host` as its first parameter. It picks `revokeBang()` or `invokeBang()` itself, from `host.behavior`. It never calls `action`, and it doesn't take the trailing `&block` / `block || data.to_s` shape. `migrationTemplate` and `setMigrationAssigns` have the same `host`-parameter shape.

## Acceptance criteria

- [ ] `createMigration` is a `this`-typed method on the generator host that calls `this.action(new CreateMigration(this, destination, block || toS(data), config))`.
- [ ] `migrationTemplate` calls it through `this`, the way Rails' `migration_template` does (`migration.rb:54-71`).
- [ ] The invented `behavior` switch in `migration.ts` is removed.
