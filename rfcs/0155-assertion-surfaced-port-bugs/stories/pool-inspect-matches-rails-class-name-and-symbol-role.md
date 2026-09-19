---
title: "pool-inspect-matches-rails-class-name-and-symbol-role"
status: closed
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "fixed in trails#7885 (ConnectionPool#inspect now matches Rails)"
---

## Context

`packages/activerecord/src/connection-pool.test.ts` test "inspect does not show secrets" is parked `it.skip` (converged body intact, BLOCKED to this story).

Rails `activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb` `ConnectionPool#inspect` renders `"#<#{self.class.name} env_name=#{db_config.env_name.inspect}#{name_field} role=#{role.inspect}#{shard_field}>"`, asserted by `activerecord/test/cases/connection_pool_test.rb:987-996` as
`/#<ActiveRecord::ConnectionAdapters::ConnectionPool env_name="\w+" role=:writing>/` and `... role=:reading shard=:shard_one>/`.

trails `connection-adapters/abstract/connection-pool.ts` `inspect()` (~:301) renders `#<ConnectionPool env_name="test" role="writing">` — no module-qualified class name, and role/shard as quoted strings rather than Symbol inspect (`:writing`). Cause not investigated beyond reading the method. Note `AbstractAdapter#inspect` (`abstract-adapter.ts:1236`) and `adapter.test.ts:463` also render role as `"writing"`, so the Symbol-inspect spelling should be decided once for both.

## Acceptance criteria

- `ConnectionPool#inspect` matches the two Rails regexes; un-skip the test.
- Adapter inspect spelling decided consistently; `adapter.test.ts` updated if it changes.
