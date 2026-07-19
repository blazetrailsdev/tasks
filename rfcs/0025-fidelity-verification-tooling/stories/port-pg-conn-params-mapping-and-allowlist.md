---
title: "port-pg-conn-params-mapping-and-allowlist"
status: done
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4970
claim: "2026-07-19T21:21:31Z"
assignee: "port-pg-conn-params-mapping-and-allowlist"
blocked-by: null
closed-reason: null
---

## Context

Found while porting the `username` -> `user` credential mapping in
[#4964](https://github.com/blazetrailsdev/trails/pull/4964).

Rails' `PostgreSQLAdapter#initialize` builds its driver params in four steps
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:322-331`):

```ruby
conn_params = @config.compact

# Map ActiveRecords param names to PGs.
conn_params[:user] = conn_params.delete(:username) if conn_params[:username]
conn_params[:dbname] = conn_params.delete(:database) if conn_params[:database]

# Forward only valid config params to PG::Connection.connect.
valid_conn_param_keys = PG::Connection.conndefaults_hash.keys + [:requiressl]
conn_params.slice!(*valid_conn_param_keys)
```

trails now ports the `username` line (#4964). The remaining three are absent
from `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
(`_pgClientOptions` construction, ~line 617): we forward the whole residual
config hash to `pg` after destructuring only the adapter-level keys.

Consequences today:

- **No `compact`.** Explicit `undefined` values reach `pg` rather than being
  dropped so the driver applies its own defaults. `driverConfig()` in the test
  harness hand-rolls this for `password`/`socket` precisely because of it.
- **No key allowlist.** Rails-native config keys with no `pg` meaning
  (`adapter`, `pool`, `checkoutTimeout`, `migrationsPaths`, ...) are passed
  straight through. `pg` ignores unknown keys, so this is latent rather than
  a live bug — but it is exactly the silent-ignore behavior that let the
  `username` bug hide, and it means a typo'd driver key is never caught.
- **No `database` -> `dbname`.** Benign: node-pg accepts `database` natively.
  Port it for symmetry with Rails, or document the intentional divergence.

`database.yml`-shaped configs are the supported public surface, so this is the
same class of deviation as the `username` one.

## Acceptance criteria

- `PostgreSQLAdapter` drops `undefined`-valued keys before handing config to
  `pg` (Rails' `@config.compact`).
- `PostgreSQLAdapter` forwards only valid `pg` connection keys, mirroring
  Rails' `slice!` against `PG::Connection.conndefaults_hash`. Establish the
  node-pg equivalent of that key list and cite it.
- `database` -> `dbname` is either ported or its omission documented inline as
  an intentional divergence with the node-pg reason.
- Tests cover: an unknown/Rails-only key is not forwarded to the driver; an
  explicit `undefined` value is dropped rather than forwarded.
- Assess whether `Mysql2Adapter` warrants the same allowlist treatment; Rails
  does NOT slice there (`::Mysql2::Client.new(config)` gets the raw hash), so
  the faithful answer may be "no" — record the conclusion either way.
