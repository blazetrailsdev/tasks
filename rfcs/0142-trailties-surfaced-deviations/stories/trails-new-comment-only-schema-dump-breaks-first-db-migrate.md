---
title: "trails new writes a comment-only db/schema.ts that the first db:migrate rejects"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8200
claim: "2026-09-27T23:46:19Z"
assignee: "scaffold-views-skip-empty-directory"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
On a fresh `trails new blog` + `bin/trails generate scaffold Post title:string body:text`,
the first `pnpm db:migrate` fails before running any migration:

```text
Error: Schema file must export a default function (got object)
    at DatabaseTasks.loadSchema (packages/activerecord/src/tasks/database-tasks.ts:598)
    at DatabaseTasks.migrateAll
```

- `packages/trailties/src/generators/app-generator.ts:1014-1020` writes a
  `db/schema.ts` that holds only two comment lines, so it exports nothing.
- `DatabaseTasks#initializeDatabase` loads the schema dump whenever the
  `schema_migrations` table is absent and the dump file exists, as Rails'
  `initialize_database` does (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:652-670`,
  the `File.exist?(schema_dump_path)` arm at `:663-665`). `loadSchema` then
  rejects the comment-only file (`database-tasks.ts:596-598`).
- Rails' app generator does not write a schema dump at all:
  `app_generator.rb:207-209` is `directory "db"`, and
  `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/db/` holds
  only `seeds.rb.tt`.

Deleting `db/schema.ts` makes the first migrate succeed, after which the dumper
writes a valid `db/schema.ts`.

## Acceptance criteria

- `trails new` does not emit `db/schema.ts`, matching `app/templates/db/`.
  Anything that reads the generated schema path at generate time (the `build`
  script's `trails-tsc --schema db/schema.ts`, the generated tsconfig `include`)
  still works on a fresh app, or is converged to what Rails does.
- An app-generator test asserts that no `db/schema.ts` is written.
- A fresh `trails new` app followed by `generate model` / `db:migrate` migrates
  with no manual step.
