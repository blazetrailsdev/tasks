---
title: "trailties: db prepare sets and restores the schema_format seat around prepareAll; test:prepare skips format resolution"
status: draft
updated: 2026-10-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8703.

Rails sets `ActiveRecord.schema_format` once, at boot, from `config.active_record.schema_format`, and `DatabaseTasks.prepare_all` (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:176`) reads the seat through `dump_schema` / `load_schema`'s `format = ActiveRecord.schema_format` defaults. Nothing saves and restores it.

`packages/trailties/src/commands/db.ts`, in the `prepare` command, does

```ts
const schemaFormatWas = schemaFormat();
try {
  setSchemaFormat(await resolveSchemaFormat({}));
  await withRegisteredConfigurations(..., () => DatabaseTasks.prepareAll());
} finally {
  setSchemaFormat(schemaFormatWas);
}
```

It is the last set / restore of the seat around an awaited block; `schema:dump`, `schema:load` and the post-migrate dump thread `format` as an argument since #8703. `runTestLoadSchema` in the same file reads the bare seat with no `resolveSchemaFormat` at all, so `test:prepare` ignores `config.schemaFormat` and `SCHEMA_FORMAT`.

## Acceptance criteria

- [ ] The resolved format (`config/database.ts` `schemaFormat`, existing-file detection) is assigned to the `ActiveRecord.schema_format` seat once where the db command loads its config, the analogue of Rails' initializer, and `prepare` no longer saves or restores it.
- [ ] `test:prepare` / `test:load_schema` honour the same resolution as `schema:load`.
- [ ] `packages/trailties/src/commands/db.test.ts` green, including "db test:prepare refuses an in-memory database when schemaFormat is sql".
