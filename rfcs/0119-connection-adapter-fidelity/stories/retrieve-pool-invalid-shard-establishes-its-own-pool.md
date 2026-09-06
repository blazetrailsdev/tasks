---
title: "retrieve connection pool with invalid shard establishes a pool Rails does not"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 7552
claim: "2026-09-06T12:58:18Z"
assignee: "respond-to-is-only-defined-on-attribute-methods-hosts"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7277 (RFC 0119 `sharding-db-tests-use-connects-to-not-handler-direct`).

Rails' `test_retrieve_connection_pool_with_invalid_shard`
(`vendor/rails/activerecord/test/cases/connection_adapters/connection_handlers_sharding_db_test.rb:226-229`)
establishes **no pool at all** — two assertions against the ambient `arunit`
connection the suite already holds:

```ruby
def test_retrieve_connection_pool_with_invalid_shard
  assert_not_nil ActiveRecord::Base.connection_handler.retrieve_connection_pool("ActiveRecord::Base")
  assert_nil ActiveRecord::Base.connection_handler.retrieve_connection_pool("ActiveRecord::Base", shard: :foo)
end
```

trails' port
(`packages/activerecord/src/connection-adapters/connection-handlers-sharding-db.test.ts`,
`retrieve connection pool with invalid shard`) establishes a `HashConfig` pool
first. #7277 tried to remove it and the test went red: this `describe` holds no
ambient `ActiveRecord::Base` pool, because its own `beforeEach`/`afterEach`
snapshot-and-remove cycle leaves none standing between tests
(`baselinePools` is captured per-test, and every non-baseline pool is removed
after each one).

So the establish is standing in for an ambient connection the suite does not
have, not for anything Rails does.

## Converged shape

Give the describe the ambient connection Rails' suite has — the `arunit`
equivalent — so the test can drop its own `establishConnection` and read the
pool the suite already holds, exactly as rb:226-229 does. That likely means the
baseline snapshot must stop removing (or must not capture) the ambient pool, so
check the `afterEach` removal loop first: the fix belongs there, not in the test
body.

The justification for the current shape lives in #7277's PR description rather
than at the call site, because `blazetrails/no-freeform-comments` is `error`
over `packages/activerecord/**` and rejects any prose comment in that file. That
is a second reason to converge rather than annotate.

## Acceptance criteria

- [ ] `retrieve connection pool with invalid shard` establishes no pool of its
      own and mirrors rb:226-229's two assertions.
- [ ] The ambient pool it reads is established by the suite, not the test.
- [ ] Test name unchanged.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
