---
title: "activerecord: SchemaDumper dumps a Schema.define call, one header for ts and js"
status: closed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "landed in trails#8745 (54b00554f9): SchemaDumper#header on origin/main emits one 'await Schema.get(version).define({ params }, async (ctx) => {' call for ts and js, _format is gone from schema-dumper.ts, the only receipt left on header is '@inventedArm if — PERMANENT' (the define_params brace arm), and the PR closed schema-dumper-header-branches-on-the-ts-js-dump-language and moved DatabaseTasks.loadSchema, activerecord-cli and trailties to the new shape"
---

## Context

Found on trails#8734 while attempting `schema-dumper-header-branches-on-the-ts-js-dump-language`.

That story suggests one header for both dump languages by JSDoc-typing `ctx`. That shape does not
converge: TypeScript ignores JSDoc types in a `.ts` file, so a dumped `db/schema.ts` reports TS7006 for
`ctx` and for every `t` block parameter under `noImplicitAny`. It was pushed and backed out on review.

The one shape that is typed in TypeScript and valid in JavaScript takes the type from a call, which is
also what Rails dumps (`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:96-111`):

```ruby
ActiveRecord::Schema[#{ActiveRecord::Migration.current_version}].define(#{define_params}) do
```

The dumped file becomes:

```ts
import { Schema } from "@blazetrails/activerecord";

export default () =>
  Schema.define({ version: 2026_01_01_000000 }, async ({ connection: ctx }) => {
    await ctx.createTable("posts", {}, (t) => {});
  });
```

`Schema.define` is already typed (`packages/activerecord/src/schema.ts`), so `ctx` and `t` are inferred
with no annotation and no `import type`. `SchemaDumper#header` (`packages/activerecord/src/schema-dumper.ts`)
then has no `this._format` arm, `_format` goes, and `trailer` closes the call.

Consumers of the current `export const defineParams` / `export default async function defineSchema(ctx)`
contract that move with it:

- `DatabaseTasks.loadSchema` (`packages/activerecord/src/tasks/database-tasks.ts`, the `ts` / `js` arm),
  which calls `Schema.define(mod.defineParams ?? {}, ...)` itself today.
- `packages/activerecord/src/support/schema-file-generator.ts`.
- `packages/activerecord-cli/src/tsc-wrapper/` schema parsers and `bin/trails-models-dump`.
- `packages/trailties/src/commands/db.ts`, `database.ts`, the `__fixtures__/boot-app/db/schema.ts` fixture,
  `virtualized-dx-tests/db/schema.ts`, and the tests that call `defineSchema(adapter)` directly.

## Acceptance criteria

- [ ] `SchemaDumper#header` emits one shape for `ts` and `js`, a `Schema.define` call, with no `this._format` arm.
- [ ] `SchemaDumper#_format` and the `@inventedArm if` receipt on `header` are deleted.
- [ ] A dumped `schema.ts` typechecks under `noImplicitAny` with `ctx` and block parameters inferred.
- [ ] `DatabaseTasks.loadSchema`, the activerecord-cli parsers and the trailties fixtures read the new shape.
- [ ] `schema-dumper-header-branches-on-the-ts-js-dump-language` is closed by the same PR.
