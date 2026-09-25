---
title: "Inline establishWithDbConfig into establishConnection (connection_handling.rb:50-54)"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

Rails `ConnectionHandling#establish_connection`
(`activerecord/lib/active_record/connection_handling.rb:50-54`) is three lines:

```ruby
config_or_env ||= DEFAULT_ENV.call.to_sym
db_config = resolve_config_for_connection(config_or_env)
connection_handler.establish_connection(db_config, owner_name: self, role: current_role, shard: current_shard)
```

trails splits the tail into a private helper `establishWithDbConfig`
(`packages/activerecord/src/connection-handling.ts`, below `establishConnection`)
that Rails does not have, and which does work Rails' method does not do:

- `validateConfigDefaultTimezone(config)` + `setDefaultTimezone(tz)` after the
  handler call — no counterpart in `connection_handling.rb:50-54`.
- `await _loadAdapter(dbConfig.adapter)` — Rails resolves the adapter lazily via
  `DatabaseConfig#adapter_class` when the pool builds a connection.
- `modelClass.connectionClass = true` — Rails sets `connection_class = true`
  only in `connects_to` (`connection_handling.rb:102`), never in
  `establish_connection`.
- `ownerName: modelClass.connectionClassForSelf()` where Rails passes
  `owner_name: self`.

Surfaced while landing trails#8008 (which made the helper return the pool).

## Acceptance criteria

- [ ] `establishWithDbConfig` is deleted; `establishConnection` calls
      `modelClass.connectionHandler.establishConnection(dbConfig, { ownerName: modelClass, role: currentRole, shard: currentShard })`
      directly and returns its pool, mirroring `connection_handling.rb:53`.
- [ ] Each of the four extra behaviours above is either moved to the Rails site
      that owns it (adapter load → `DatabaseConfig#adapter_class` / pool; tz →
      wherever Rails applies `default_timezone` config; `connection_class` →
      `connects_to` only) or removed, with a Rails `file:line` cite per move.
- [ ] `connection-handler.test.ts` and the tasks tests stay green on all lanes.
