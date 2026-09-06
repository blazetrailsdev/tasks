---
title: "DatabaseConfigurations.defaultEnv is a public static accessor pair where Rails has a private instance default_env"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 7533
claim: "2026-09-05T20:06:45Z"
assignee: "conversion-and-serialization-tests-redeclare-shared-models"
blocked-by: null
closed-reason: null
---

## Context

Rails' `default_env` is a **private instance method** on
`ActiveRecord::DatabaseConfigurations`
(`vendor/rails/activerecord/lib/active_record/database_configurations.rb:187-190`,
under the `private` at `:186`):

```ruby
private
  def default_env
    ActiveRecord::ConnectionHandling::DEFAULT_ENV.call.to_s
  end
```

and every reader inside the class calls it bare — `configs_for`
(`:57`), `resolve` (`:181`), `build_configs`, the `find_db_config` /
`primary?` neighbours.

trails has it as a **public static accessor pair** on the class
(`packages/activerecord/src/database-configurations.ts`):

```ts
static get defaultEnv(): string { return String(_DEFAULT_ENV!()); }
static set defaultEnv(value: string | null) { _setRailsEnv(value); }
```

so the internal call sites read `DatabaseConfigurations.defaultEnv` rather than
`this.defaultEnv()`, and the setter — which has no Rails counterpart at all;
Rails assigns `Rails.env`, not a `DatabaseConfigurations` field — is public API
that `DatabaseTasks.env=` (`packages/activerecord/src/tasks/database-tasks.ts:54`)
and eleven `activerecord-cli` call sites reach through.

PR #7485 routed the body through `DEFAULT_ENV` and deleted the
`_defaultEnvGetter` funnel, but left the member's SHAPE untouched; the
`| call` baseline row it retired was against `rubyName: default_env`, so the
member is matched and the shape divergence is invisible to `parity:api`.

## Converged shape

- A private instance `defaultEnv(): string` returning `String(DEFAULT_ENV())`,
  with the in-class readers (`configsFor`, `isPrimary`, `resolve`,
  `buildConfigs`, `mergeDbEnvironmentVariables`) calling `this.defaultEnv()`.
- The public static getter and setter go away. Their out-of-class readers —
  `activerecord-cli`'s `db-tasks.ts`, `runner.ts`, `db-helpers.ts`,
  `console.ts`, plus `schema.ts` and `tasks/database-tasks.ts` — call
  `DEFAULT_ENV()` from `connection-handling.js` directly, which is what Rails'
  `DatabaseTasks.env` does (`tasks/database_tasks.rb`).
- The assignment half is the harder question and can be split: Rails has no
  `DatabaseConfigurations.default_env=`, so the `_railsEnv` slot's writer wants
  a `Trails.env=` home (trailties) rather than a `DatabaseConfigurations` one.
  Size that separately if it does not fit.

## Acceptance criteria

- `defaultEnv` is a private instance method matching
  `database_configurations.rb:187-190`, and the static pair is gone or reduced
  to the assignment half with its own filed follow-up.
- `pnpm parity:api` non-negative for activerecord; `parity:api:extra:gate` and
  `parity:api:calls` green.
- The three `DatabaseConfigurationsTest > currentEnv resolution` tests, which
  pin the `TRAILS_ENV` precedence, keep their names and pass.
