---
title: "activerecord: load_schema's :ruby arm is a bare load(file)"
status: ready
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks#load_schema`'s `:ruby` arm is `load(file)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:383-385`): the schema file
is a script that calls `ActiveRecord::Schema.define` itself.

trails' arm (`packages/activerecord/src/tasks/database-tasks.ts#loadSchema`) imports the file, reads a
`default` export and an optional `defineParams` export off the module, and calls
`Schema.define(mod.defineParams ?? {}, (schema) => defineSchema(schema.connection))` on the file's behalf.
So the schema file trails dumps is not a script that calls `Schema.define`, and `loadSchema` makes a
`Schema.define` call Rails' body does not. It also falls back to treating the module namespace itself as
the function (`mod.default ?? mod`) and reaches `getPath().pathToFileURL!` with no ruby-compat `load`.

## Acceptance criteria

- [ ] Decide, against `ActiveRecord::SchemaDumper`'s output (`schema_dumper.rb`), whether the dumped
      `schema.ts` can be a module whose evaluation calls `Schema.define` (top-level await permitting), so
      the `:ruby` arm is a single `load(file)`.
- [ ] If it can, `loadSchema` calls ruby-compat's `load` and nothing else in that arm, and the dumper emits
      the matching file. If it cannot, block this story with the specific language constraint.
