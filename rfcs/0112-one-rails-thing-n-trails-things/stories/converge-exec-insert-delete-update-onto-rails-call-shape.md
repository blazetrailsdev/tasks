---
title: "converge-exec-insert-delete-update-onto-rails-call-shape"
status: claimed
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T11:40:36Z"
assignee: "hash-config-primary-resolves-via-global-configurations"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseStatements#exec_insert`, `#exec_delete` and `#exec_update`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:157-174`)
are:

    def exec_insert(sql, name = nil, binds = [], pk = nil, sequence_name = nil, returning: nil)
      sql, binds = sql_for_insert(sql, pk, binds, returning)
      internal_exec_query(sql, name, binds)
    end

    def exec_delete(sql, name = nil, binds = [])
      affected_rows(internal_execute(sql, name, binds))
    end

    def exec_update(sql, name = nil, binds = [])
      affected_rows(internal_execute(sql, name, binds))
    end

trails' live bodies in the `DatabaseStatements` mixin object
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`)
all route through `this.executeMutation(sql, binds, name)` instead —
`executeMutation` is a trails invention with no Rails counterpart
(see the comment at `connection-adapters/postgresql-adapter.ts:1693`).

This divergence is pre-existing but was invisible to `parity:api:calls` until
PR #6772: the file used to define each method twice — a dead file-level
`export function` and the live mixin body — and the extractor matched the dead
copy, which did make Rails' calls. #6772 removed the duplication (RFC 0112
story `database-statements-duplicate-bodies-free-function-and-mixin`), so the
live bodies are now what is measured, and six rows were baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/database-statements.json`
naming this story.

PR #6772 also proved this is not a drive-by fix. Restoring the Rails call shape in
those bodies reds every adapter lane: `internal_execute`'s live signature is
`(sql, binds, name)` on the adapters, not the abstract file's `(sql, name,
{binds})`, and an unconditional `sql_for_insert` appends `RETURNING` where
PostgreSQL rejects it. Converging means converging `executeMutation` and
`internalExecute` together, which is its own PR.

## Acceptance criteria

- [ ] `execInsert` is `sqlForInsert(...)` then `internalExecQuery(sql, name, binds)`.
- [ ] `execDelete` / `execUpdate` are `affectedRows(internalExecute(sql, name, binds))`.
- [ ] `internalExecute`'s signature is consistent between the abstract file and
      the adapter overrides, or the divergence is closed some other way.
- [ ] The six `exec_insert` / `exec_delete` / `exec_update` rows are deleted
      from the call-mismatch shard (by hand, no reseed).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — in particular
      `adapter-prevent-writes.test.ts` and `relation/update-all.trails.test.ts`,
      which #6772 measured as the first casualties.
