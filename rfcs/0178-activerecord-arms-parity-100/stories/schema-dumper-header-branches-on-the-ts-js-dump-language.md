---
title: "schema-dumper-header-branches-on-the-ts-js-dump-language"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/schema-dumper.ts` `header` branches twice on `this._format === "ts"`: once to
emit `import type { DatabaseAdapter } from "@blazetrails/activerecord";`, once to choose between the typed
`export default async function defineSchema(ctx: DatabaseAdapter) {` and the JSDoc-annotated JS form.
Rails' `header` (`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:96-111`) is one
heredoc with no branch: it dumps Ruby only. The two arms are reported by
`pnpm parity:api:arms:report --package=activerecord --direction=invented` as `schema-dumper.ts#header +if +if`
and carry `@inventedArm if — CONVERGEABLE schema-dumper-header-branches-on-the-ts-js-dump-language`.

The `_format` field is read from `schemaFormat()` in the constructor (`schema_dumper.rb:74-83` has no such
ivar). Either the dumped file takes one shape for both languages (a JSDoc-typed `ctx` parses as TypeScript
and as JavaScript), which removes the field and both arms, or the ts/js split is ratified in
`packages/activerecord/CLAUDE.md` and the receipt becomes `PERMANENT`.

## Acceptance criteria

- [ ] `header` has no `this._format` arm, or the arm's receipt is `PERMANENT` against a ratified section.
- [ ] If the arms go, `SchemaDumper#_format` goes with them.
- [ ] The invented-direction arms report shows no unreceipted row for `schema-dumper.ts#header`.
