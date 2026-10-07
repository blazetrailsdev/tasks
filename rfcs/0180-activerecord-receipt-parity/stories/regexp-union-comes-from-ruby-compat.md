---
title: "ruby-compat: port Regexp.union; build_read_query_regexp and table_structure_sql call it"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["ruby-compat", "activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the two receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

Two bodies hand-roll `Regexp.union` (`vendor/ruby/v3.3.11/re.c:4192` `rb_reg_s_union`) and carry `@missingRailsCall union`:

- `AbstractAdapter.build_read_query_regexp` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:86-90`) maps each part to `/#{part}/i` and interpolates `Regexp.union(*parts)`. `packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `buildReadQueryRegexp` skips the `map`, joins the parts with `|` and puts a single `i` flag on the whole pattern, so the comment prefix is matched case-insensitively too.
- `SQLite3Adapter#table_structure_sql` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:786`) interpolates `Regexp.union(column_names).source`. `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`'s `tableStructureSql` escapes each name with an inline character class and substitutes `(?!)` for an empty list by hand.

ruby-compat already ports `Regexp.escape` (`regexpEscape`) and has no `Regexp.union`. The String arm is the escape joined with `|`, and the empty arm is `/(?!)/`. The Regexp arm embeds each pattern's `to_s`, which carries its own flags (`(?i-mx:begin)`); JS has that syntax only as RegExp modifiers, so the port has to decide what it emits where the runtime lacks them.

## Acceptance criteria

- [ ] ruby-compat exports the `Regexp.union` port, cited to `re.c:4192`, with its row in the ruby-compat call table and unit tests for the String, Regexp, mixed and empty arms checked against `ruby`.
- [ ] `buildReadQueryRegexp` is `parts += DEFAULT_READ_QUERY`, the `map`, and the union interpolated after the comment prefix, as `abstract_adapter.rb:86-90` has it; `tableStructureSql` splits on the union's `source`.
- [ ] Both `@missingRailsCall union` receipts are deleted; `pnpm parity:api:calls` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:ruby-compat && pnpm vitest run packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts
```
