---
title: "resolve-pool-config-validate-bang"
status: ready
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ConnectionHandler#resolve_pool_config` calls `db_config.validate!`
between resolving the config and the adapter guard
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:275-280`):

```ruby
db_config = Base.configurations.resolve(config)
db_config.validate!
raise(AdapterNotSpecified, "...") unless db_config.adapter
```

trails skips the `validate!` call
(`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`,
`resolvePoolConfig`). The reason is structural, not an oversight: our
counterpart `DatabaseConfig#validateBang`
(`packages/activerecord/src/database-configurations/database-config.ts:298`)
is `async` because it awaits `adapterClass()`, while `resolvePoolConfig` and
its only caller `establishConnection` are synchronous. Calling it would mean
floating a promise or making `establishConnection` async.

The consequence is that an unresolvable adapter name is not surfaced at
`establishConnection` time as it is in Rails — only the weaker
"does not specify adapter" guard fires. The failure is deferred to the first
connection checkout.

Noted inline as a known deviation in PR #5512; registered here rather than
widening that PR's scope.

## Acceptance criteria

- [ ] `resolvePoolConfig` calls the trails equivalent of `db_config.validate!`
      between `resolve` and the adapter guard, matching
      `connection_handler.rb:277`.
- [ ] A test covers an `establishConnection` with an adapter name that resolves
      to no adapter class and asserts it raises at establish time.
- [ ] Decide and document how the sync/async split is bridged (make the path
      async, or add a sync validation that does not need `adapterClass()`) —
      whichever is taken, no floated promises.
