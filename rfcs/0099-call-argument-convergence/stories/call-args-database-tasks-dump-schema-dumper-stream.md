---
title: "call-args-database-tasks-dump-schema-dumper-stream"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6489
claim: "2026-08-13T19:15:40Z"
assignee: "call-args-database-tasks-dump-schema-dumper-stream"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-database-tasks-handler-protocol` (RFC 0099). That story
converged the registered-task handler protocol — task classes are now
constructed with the db config and dispatched with Rails' argument list — and
deleted the eight `kind: "args"` rows it fixed. One row in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`
survives:

    rubyName: dump_schema   call: dump
    rubyArgs: ["ref:migrationConnectionPool", "ref:file"]

Rails' `dump_schema` writes the schema through
`ActiveRecord::SchemaDumper.dump(migration_connection_pool, file)`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:441`),
where `dump(pool = Base.connection_pool, stream = $stdout, config = Base)`
takes a pool and an output _stream_ and returns the stream
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:44-49`).

trails' `SchemaDumper.dump` instead takes an adapter (or a `SchemaSource`) plus
an options object and _returns_ the dumped string
(`packages/activerecord/src/schema-dumper.ts:455-457`), so
`DatabaseTasks.dumpSchema` calls `SchemaDumper.dump(adapter, { language })` and
writes the result itself
(`packages/activerecord/src/tasks/database-tasks.ts` — the `format !== "sql"`
arm of `dumpSchema`). Converging the call means converging the dumper's own
signature onto Rails' pool/stream shape, which reaches every `SchemaDumper.dump`
caller in the repo — hence its own story rather than a drive-by.

## Acceptance criteria

1. `SchemaDumper.dump` takes Rails' `(pool, stream, config)` parameters, in
   Rails' order, with Rails' defaults, and returns the stream
   (`schema_dumper.rb:44-49`); callers updated.
2. `DatabaseTasks.dumpSchema` calls `dump(migrationConnectionPool, file)` inside
   the file-open, matching `database_tasks.rb:439-442`.
3. The `dump_schema` → `dump` `kind: "args"` row is DELETED by hand
   (only-shrink; never `--write`).
4. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green; the
   schema-dumper and database-tasks suites stay green.
