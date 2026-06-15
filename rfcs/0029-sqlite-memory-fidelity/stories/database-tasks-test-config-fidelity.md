---
title: "database-tasks.test.ts: converge 28 excess :memory: sites to Rails config fidelity"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`tasks/database-tasks.test.ts` hardcodes `:memory:` in **30** places (e.g.
`Base.establishConnection({ adapter: "sqlite3", database: ":memory:", pool: 1 })`
at lines 139, 197, 225, 254, 712, … plus nested HashConfigs). Rails'
`tasks/database_tasks_test.rb` uses `:memory:` in only **2** spots:

```ruby
# vendor/rails/activerecord/test/cases/tasks/database_tasks_test.rb
database: ":memory:", migrations_paths: migrations_path   # :1039 (a migrations-path case)
assert_match(/database: :memory:/, output)                # :1172 (an output assertion)
```

The other ~28 trails sites stand in for cases where Rails uses a configured
HashConfig with a real/file database name (DatabaseTasks create/drop/purge/
load*schema are about \_named* databases — `:memory:` cannot meaningfully be
created or dropped). These are divergences.

## Acceptance criteria

- [ ] Each `:memory:` site is judged against the corresponding
      `database_tasks_test.rb` case; sites that Rails expresses with a named /
      file-backed config are converged to that (file-backed temp DB or the
      ambient config), and only the ~2 genuinely-`:memory:` cases (migrations-
      path, output assertion) keep `:memory:`.
- [ ] create/drop/purge/load-schema cases address a real file DB so the task
      under test actually does I/O (mirror Rails' `db_config` usage).
- [ ] Temp DB files are cleaned up (incl. `-wal`/`-shm`); no leak, no
      cross-test collision.
- [ ] Test names unchanged; behavior matches `database_tasks_test.rb`.
- [ ] **PR stays under the trails 500-LOC ceiling.** If converging all 28 sites
      exceeds it, ship the cohesive subset that fits and register the remainder
      as a follow-up story (do NOT open a sibling PR) with:

  ```bash
  pnpm tasks new 0029-sqlite-memory-fidelity database-tasks-test-config-fidelity-2
  ```

- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

Largest single-file convergence in this RFC. Read `database_tasks_test.rb`
end-to-end first and build a per-line mapping before editing. Watch for
deliberate-error cases that need transaction isolation (memory
`project_pg_deliberate_error_tests_need_usestransaction`) — though this file is
SQLite-oriented, the create/drop cases can poison shared state if not isolated.
</content>
