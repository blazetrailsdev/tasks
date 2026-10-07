---
title: "activerecord: export_name_on_schema_dump? matches through a stateless Regexp#match?"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ForeignKeyDefinition#export_name_on_schema_dump?` and `CheckConstraintDefinition#export_name_on_schema_dump?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:157-159,185-187`):

```ruby
def export_name_on_schema_dump?
  !ActiveRecord::SchemaDumper.fk_ignore_pattern.match?(name) if name
end
```

`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts` writes
`this.name.search(SchemaDumper.fkIgnorePattern) === -1` in both. The first carries
`@missingRailsCall match?`; the second is a row in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/schema-definitions.json`.

The audit tried the gate's own analogue, `RegExp#test` (`JS_ENUMERABLE_ALIASES` maps `match?` to
`test`). It reds `schema-definitions.trails.test.ts` "stays stable across repeated calls with a
g-flagged pattern": `fk_ignore_pattern` is a user-settable `cattr_accessor`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb`), and `RegExp#test` on a
`g`- or `y`-flagged pattern advances `lastIndex`, so the second call answers differently. Ruby's
`Regexp#match?` (`vendor/ruby/v3.3.11/re.c:3811` `rb_reg_match_p`) keeps no state at all — it does
not even set `$~`. `String#search` is the one JS form that saves and restores `lastIndex`, which is
why the port uses it, and why the call cannot be spelled `test` here.

ruby-compat already has a `regexp.ts`; it has no `match?`.

## Acceptance criteria

- [ ] ruby-compat exports `Regexp#match?` (`rb_reg_match_p`) as a function that answers the same for a pattern carrying `g` or `y` on every call, with its MRI anchor, its row in `scripts/parity/ruby-compat.ts`, and unit tests for the flagged cases.
- [ ] Both `isExportNameOnSchemaDump` bodies are `!match?(pattern, name) if name` through that export, and answer `nil` (not `false`) for a nameless definition as Rails does, if no caller depends on the boolean.
- [ ] The `@missingRailsCall match?` receipt and the `export_name_on_schema_dump?` baseline row are both deleted, and the shard's mark tightened with `pnpm parity:api:calls:tighten`.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/abstract/schema-definitions.trails.test.ts packages/activerecord/src/schema-dumper.test.ts
```
