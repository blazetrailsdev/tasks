---
title: "build_configs inlines for_current_env? and invents _isThreeLevelConfig"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseConfigurations#build_configs`
(`vendor/rails/activerecord/lib/active_record/database_configurations.rb:200-217`)
is eight lines and delegates its one predicate:

```ruby
unless db_configs.find(&:for_current_env?)
  db_configs << environment_url_config(default_env, "primary", {})
end
```

where `for_current_env?`
(`database_configurations/database_config.rb:91-93`) is
`env_name == ActiveRecord::ConnectionHandling::DEFAULT_ENV.call`.

`packages/activerecord/src/database-configurations.ts:176-198` diverges three
ways, all in the same method:

1. **The delegation is inlined.** `!dbConfigs.some((c) => c.envName === defaultEnv)`
   re-spells `for_current_env?` rather than calling it — even though trails HAS
   the predicate at `database-configurations/database-config.ts:213`. That is
   the dropped-delegation class `parity:api:calls` exists to catch; it is
   invisible here only because the ported name is `buildConfigs`, whose baseline
   row already covers it.
2. **`environment_url_config`'s result is guarded.** Rails pushes it
   unconditionally (`db_configs << ...`) and lets the following `.compact` drop
   a nil; trails writes `if (urlConfig) dbConfigs.push(urlConfig)` and then
   ALSO filters. One of the two arms is Rails', the other is invented.
3. **`_isThreeLevelConfig` is an invented helper.** Rails inlines the test as
   `config.is_a?(Hash) && config.values.all?(Hash)` (`:205`). trails extracts a
   private method whose body adds checks Rails does not have — an
   `"adapter" in obj || "url" in obj || "database" in obj` early return and a
   `values.length === 0` arm — so a config Rails would walk as three-level can
   be classified as two-level instead.

## Converged shape

- `buildConfigs` calls `c.forCurrentEnv` rather than comparing `envName` itself.
- `environmentUrlConfig`'s result is pushed the way Rails pushes it, with the
  single `compact`/`filter` that Rails has doing the dropping.
- `_isThreeLevelConfig` is inlined at its one call site as Rails inlines it, and
  the three extra checks either go away or are justified against a Rails line
  that has them. If any is load-bearing for a test, that test names the Rails
  behaviour it is pinning.

## Acceptance criteria

- `buildConfigs` reads as `database_configurations.rb:200-217`, method for
  method and branch for branch; `_isThreeLevelConfig` is gone from the public
  and private surface.
- `pnpm parity:api:extra:gate` for activerecord reports `total` DOWN, and its
  `call-mismatches-exclude` row for `buildConfigs` shrinks or retires.
- `database-configurations.test.ts` and `database-configurations/resolver.test.ts`
  stay green on all three adapters, with no test names changed.
