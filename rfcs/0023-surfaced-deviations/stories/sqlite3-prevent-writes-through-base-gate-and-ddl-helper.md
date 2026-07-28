---
title: "sqlite3 prevent-writes: drive through Base.whilePreventingWrites + with_example_table"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while converting the sqlite3 adapter sibling suites to the ambient
connection (PR #5499, RFC 0029).

`sqlite3_adapter_prevent_writes_test.rb` drives every case through
`ActiveRecord::Base.while_preventing_writes` and `DdlHelper#with_example_table`:

```ruby
def test_errors_when_an_insert_query_is_called_while_preventing_writes
  with_example_table "id int, data string" do
    ActiveRecord::Base.while_preventing_writes do
      assert_raises(ActiveRecord::ReadOnlyError) do
        @conn.execute("INSERT INTO ex (data) VALUES ('138853948594')")
      end
    end
  end
end
```

`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter-prevent-writes.test.ts`
diverges on three axes:

1. It calls `adapter.withPreventedWrites(...)` — an adapter-level gate — rather
   than `Base.whilePreventingWrites`, so the connection-handler path Rails
   exercises is never touched.
2. It has no `with_example_table` analogue, so each case creates its own table
   (`pw`, `pw2`, `pw3`, `pw4`, `pw5`) instead of Rails' single `ex`, and cleanup
   is a shared `afterEach` drop list rather than a per-test `ensure`.
3. It uses `executeMutation` where Rails uses `execute` for the write probes —
   see RFC 0023 `project_execute_mutation_split_is_the_deviation`.

Item 1 is the substantive one: the suite's whole point is that the _handler_
blocks writes on a replica-shaped connection.

## Acceptance criteria

- [ ] Port `DdlHelper#with_example_table` (`test/support/ddl_helper.rb`) as a
      shared test helper: creates the table, yields, drops it in a `finally`.
- [ ] Cases use the single Rails table name `ex` with Rails' column definition
      (`"id int, data string"`), dropping `pw`..`pw5` and the shared teardown.
- [ ] Cases go through `Base.whilePreventingWrites`, not
      `adapter.withPreventedWrites`. If the handler-level gate is not wired for
      SQLite yet, that is the finding — file/flag it rather than papering over
      with the adapter gate.
- [ ] `useTransactionalTests: false` is retained (Rails sets
      `self.use_transactional_tests = false`); with a per-test `ensure` drop the
      aborted-worker leak noted in PR #5499 review round 1 goes away.
- [ ] Test names unchanged.
