---
title: "adapter.test.ts: derive connection from ambient test config, not :memory:"
status: draft
updated: 2026-06-15
rfc: "0000-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`adapter.test.ts` hardcodes `:memory:` connections (8 occurrences). Rails'
`adapter_test.rb` never names a database — it runs against the ambient,
file-backed `arunit` connection and derives reconfigured connections from it:

```ruby
# vendor/rails/activerecord/test/cases/adapter_test.rb
@connection = ActiveRecord::Base.lease_connection                       # :13
ActiveRecord::Base.establish_connection(db_config.configuration_hash.except(:database))  # :163
ActiveRecord::Base.establish_connection :arunit                         # :172
ActiveRecord::Base.establish_connection(db_config.configuration_hash.merge(prepared_statements: true))  # :180,185
```

Hardcoding `:memory:` means these cases never exercise the file-backed default
Rails uses, and the `except(:database)` / `merge(...)` re-establish cases lose
their meaning (there is nothing to derive _from_).

## Acceptance criteria

- [ ] Connections in `adapter.test.ts` are derived from the live test config
      (the ambient worker-DB config / `Base.connection_pool.db_config`
      equivalent) and reconfigured with `.merge`/option overrides, mirroring
      `adapter_test.rb`'s `lease_connection` / `establish_connection(config…)`
      pattern — instead of literal `{ adapter: "sqlite3", database: ":memory:" }`.
- [ ] Cases that Rails expresses as "re-establish with database removed /
      prepared_statements toggled" are mirrored against the derived config.
- [ ] Test names unchanged; behavior matches the Rails test.
- [ ] CI green on all three adapters (this test runs under every ARCONN);
      `test:compare` delta non-negative.

## Notes

If a reusable "derive-from-ambient-test-config + merge" helper is warranted,
introduce it here (RFC Open Question 2) and let sibling ambient stories reuse
it. Do not add an empty stub helper (CLAUDE.md). Read `adapter_test.rb` first.
</content>
