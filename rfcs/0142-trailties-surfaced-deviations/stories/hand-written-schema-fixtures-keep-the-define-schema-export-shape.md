---
title: "trailties: hand-written db/schema.ts fixtures keep the defineSchema export shape the dumper no longer emits"
status: draft
updated: 2026-10-10
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::SchemaDumper#header`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:96-111`) dumps a script that
calls `ActiveRecord::Schema.define` itself, and `DatabaseTasks#load_schema`'s `:ruby` arm is a bare
`load(file)` (`tasks/database_tasks.rb:383-385`). trails now does the same: the dumper emits

```ts
import { Schema } from "@blazetrails/activerecord";

await Schema.define({ version: 2026_09_26_000000 }, async ({ connection: ctx }) => {
```

and `loadSchema` calls `rbFLoad(file)` and nothing else in that arm.

Three hand-written schema files still have the old shape, an
`export default async function defineSchema(ctx: DatabaseAdapter)` with an optional
`export const defineParams`:

- `packages/trailties/src/__fixtures__/boot-app/db/schema.ts`, imported as a function and called
  with a bare adapter by `packages/trailties/src/boot-app-cold-model.trails.test.ts`,
  `packages/trailties/src/commands/routes.trails.test.ts` and
  `packages/trailties/src/commands/unused-routes.trails.test.ts`.
- `packages/trailties/virtualized-dx-tests/db/schema.ts`.
- The schema text written by
  `packages/trailties/src/generators/rails/scaffold/scaffold-generator.trails.test.ts` (near `:140`).

A `db:schema:load` against any of them now evaluates a module that only exports and defines no
table. `packages/activerecord/src/support/schema-file-generator.ts` also still emits the old shape
for its own test.

## Acceptance criteria

- [ ] The three files are scripts in the shape the dumper emits, and the tests that imported
      `defineSchema` establish a connection and load the file through `DatabaseTasks.loadSchema`
      or `rbFLoad`.
- [ ] `schema-file-generator.ts` emits the dumper's shape, or is deleted if nothing reads it.
- [ ] No `export default async function defineSchema` remains outside a test that asserts on
      text `trails-tsc --schema` parses.
