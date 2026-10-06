---
title: "activerecord: SchemaDumper.language is a mutable class static Rails has no seat for"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "trailties"]
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

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/schema-dumper.ts` declares `static language: SchemaDumpLanguage = "ts"` on
`SchemaDumper`. `vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb` has no such
member: a Ruby dump is always Ruby, and the only format switch is `ActiveRecord.schema_format`
(`:ruby` / `:sql`). The name scores as a moved extra and carried `@noRailsEquivalent PERMANENT`.

trails dumps the schema file as TypeScript or JavaScript, and the choice is threaded through a
mutable class static that three sites read or write:

- `SchemaDumper`'s constructor: `options.language ?? this.constructor.language`.
- `packages/activerecord/src/database-configurations/hash-config.ts` `schemaFileType`:
  `schema.${SchemaDumper.language}` where Rails answers the literal `"schema.rb"`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/hash_config.rb:149-177`).
- `packages/trailties/src/commands/db.ts` `withResolvedSchemaFormat`: saves the static, assigns it,
  and restores it in a `finally`.

No CLAUDE.md section ratifies a dump-language seat. A set / restore around an awaited block is also
the shape that leaks across concurrent async callers.

## Acceptance criteria

- [ ] The dump language has one seat Rails-shaped code can name: either it rides `ActiveRecord.schema_format`'s own value set (`"ts"` / `"js"` in place of `:ruby`), or it is ratified in CLAUDE.md as the TypeScript counterpart of the `.rb` schema file. `SchemaDumper.language` and its receipt are deleted either way.
- [ ] `HashConfig#schemaFileType` and `withResolvedSchemaFormat` read that seat; no caller saves and restores a class static.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green; `packages/activerecord/src/schema-dumper.test.ts` and the trailties `db` command tests stay green.
