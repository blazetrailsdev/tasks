---
title: "connection-pool.test.ts: derive PoolConfig from ambient db_config like Rails"
status: draft
updated: 2026-06-15
rfc: "0000-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 45
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`connection-pool.test.ts` hardcodes `:memory:` (3 occurrences). Rails'
`connection_pool_test.rb` derives its `HashConfig`/`PoolConfig` from the
ambient pool and merges per-test options onto it — it never names a database:

```ruby
# vendor/rails/activerecord/test/cases/connection_pool_test.rb:20-29
config = ActiveRecord::Base.connection_pool.db_config
@db_config = ActiveRecord::DatabaseConfigurations::HashConfig.new(
  config.env_name, config.name, config.configuration_hash)
@pool_config = ActiveRecord::ConnectionAdapters::PoolConfig.new(
  ActiveRecord::Base, @db_config, :writing, :default)
# :265-269, :293-296 — merge(idle_timeout: …) onto config.configuration_hash
```

## Acceptance criteria

- [ ] The pool's `HashConfig`/`PoolConfig` is built from the ambient test
      config (the live worker-DB config) and reconfigured via merge for the
      idle-timeout / option cases, mirroring `connection_pool_test.rb:20-29`,
      `:265-269`, `:293-296` — not a literal `:memory:` config.
- [ ] Test names unchanged; pool/checkout/idle-timeout behavior matches Rails.
- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

Reuse the derive-from-ambient helper if `adapter-test-ambient-connection`
introduced one. Read `connection_pool_test.rb` first.
</content>
