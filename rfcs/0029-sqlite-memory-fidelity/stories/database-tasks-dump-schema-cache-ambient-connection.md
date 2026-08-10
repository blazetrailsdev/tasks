---
title: "database-tasks.test: dump schema cache should lease the ambient connection and clear_cache! in teardown"
status: done
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5297
claim: "2026-07-25T13:12:31Z"
assignee: "database-tasks-dump-schema-cache-ambient-connection"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasksDumpSchemaCacheTest#dump schema cache` in
`packages/activerecord/src/tasks/database-tasks.test.ts` calls
`Base.establishConnection(...)` with an explicit config. Rails'
`test_dump_schema_cache`
(`vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb:288`)
establishes nothing — it dumps off the ambient `arunit` connection via
`ActiveRecord::Base.lease_connection`, and its `ensure` block calls
`ActiveRecord::Base.clear_cache!`.

PR #5288 converged the connection from `:memory:` to a file-backed temp DB
(the RFC 0029 goal) but deliberately left the `establishConnection` call in
place: trails' AR test setup establishes no ambient connection, so there is
nothing to lease (see memory
`project_test_setup_ar_establishes_no_connection_module_scope_tosql`). This is
the same deviation the sibling `*-ambient-connection` stories in this RFC
address, and it was independently flagged in review of #5288.

Two sub-gaps, both in this one test:

1. `establishConnection` where Rails leases the ambient connection.
2. Our `finally` does `Base.removeConnection()`; Rails' `ensure` does
   `clear_cache!`. The cache is never cleared, so a dumped schema cache can
   leak into a later test in the same worker.

## Acceptance criteria

- [ ] `dump schema cache` derives its connection from the ambient pool rather
      than establishing its own, matching `database_tasks_test.rb:288` — or, if
      the ambient-connection plumbing is still absent, the story documents that
      at the call site and converges only the `clear_cache!` teardown.
- [ ] Teardown mirrors Rails' `ensure ActiveRecord::Base.clear_cache!`.
- [ ] Test name unchanged; `parity:test` delta non-negative.
