---
title: "DatabaseConfig holds the configuration hash Rails keeps on HashConfig"
status: draft
updated: 2026-08-29
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `establish_connection`'s adapter backfill in PR #7215.

Rails splits these two classes cleanly, and trails does not.

`DatabaseConfigurations::DatabaseConfig` is the _abstract_ base and holds only
two ivars (`database_config.rb:9-14`):

```ruby
attr_reader :env_name, :name

def initialize(env_name, name)
  @env_name = env_name
  @name = name
end
```

Everything about the configuration hash lives one level down, on `HashConfig`:

- `attr_reader :configuration_hash` (`hash_config.rb:23`)
- `@configuration_hash = configuration_hash.symbolize_keys.freeze` (`:40`)
- `def _database=(database)` (`:68-70`)
- `database`, `socket`, `pool` and friends, all reading `configuration_hash`
  (`:60-74`)

trails hoists all of it onto `DatabaseConfig`
(`packages/activerecord/src/database-configurations/database-config.ts`): the
`#configuration` private field, the `configuration` / `configurationHash`
getters, `set _database`, `adapter`, `database`, `host`, `socket`. Its
constructor also takes a third `configuration` parameter Rails' two-parameter
`initialize` does not have.

That hoist has a concrete cost, which is what surfaced it. Because
`#configuration` is a JS private field on the base, `UrlConfig`'s constructor
cannot write it the way `url_config.rb:43` writes `@configuration_hash`
directly. PR #7215 removed the free function `_setConfigurationHash` (a
module-level write path reachable from anywhere) and replaced it with a
`protected setConfigurationHash` on `DatabaseConfig` — better, but still a
method Rails has no counterpart for, existing only to bridge the misplaced
field.

## Converged shape

`DatabaseConfig` keeps only `envName` / `name` and a two-parameter constructor,
matching `database_config.rb:9-14`. The configuration hash and every reader
over it move down to `HashConfig`, where a `protected` field can be assigned
directly by `UrlConfig`'s constructor exactly as `url_config.rb:43` assigns the
ivar — retiring `setConfigurationHash` entirely.

Check `DatabaseConfig`'s other members against `database_config.rb` while
moving: several (`adapter`, `database`, `host`, `socket`) are `HashConfig`
readers upstream, and `validateBang` / `adapterClass` / `newConnection` should
be audited against the same file rather than assumed correct.

## Acceptance criteria

- [ ] `DatabaseConfig`'s constructor takes `(envName, name)` and the class
      holds no configuration hash, matching `database_config.rb:9-14`.
- [ ] `configurationHash` and its readers live on `HashConfig`, matching
      `hash_config.rb:23,40,60-74`.
- [ ] `setConfigurationHash` is deleted; `UrlConfig`'s constructor assigns the
      field directly, mirroring `url_config.rb:43`.
- [ ] `pnpm parity:api --package activerecord` inheritance/method figures do
      not regress; `pnpm parity:api:extra --package activerecord` does not grow.
- [ ] Green on all three lanes.
