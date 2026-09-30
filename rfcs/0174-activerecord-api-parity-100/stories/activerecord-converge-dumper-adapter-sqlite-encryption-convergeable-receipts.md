---
title: "activerecord: the CONVERGEABLE receipts in schema-dumper, abstract-mysql-adapter, encryptable-record, sqlite/"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md admits two receipt shapes, `PERMANENT` and `CONVERGEABLE <story-id>`. These receipts say
`CONVERGEABLE` and then carry prose instead of a story id, so nothing tracks them
(`name-stories-for-activerecord-malformed-deviation-receipts`, RFC 0127, counts 92 such sites repo-wide;
`convergeable-tag-story-id`, RFC 0120, makes the shape an error). This story is the convergence the
prose promises, for:

- `schema-dumper.ts:361` `@noRailsEquivalent` — CONVERGEABLE the per-table body of SchemaDumper#tables (schema_dumper.rb:134), extracted so dumpTableSchema shares it.
- `connection-adapters/abstract-mysql-adapter.ts:1500` `@noRailsEquivalent` — CONVERGEABLE the SHOW CREATE TABLE parsing of AbstractMysqlAdapter#table_options (abstract_mysql_adapter.rb:549), extracted for unit testing.
- `encryption/encryptable-record.ts:46` `@noRailsEquivalent` — CONVERGEABLE the missing-original-column raise of encrypts (encryption/encryptable_record.rb:101-103), split out for the deferred re-check.
- `sqlite/sqlite-uri.ts:41` `@noRailsEquivalent` — CONVERGEABLE the file:/:memory: handling Ruby leaves to SQLITE_OPEN_URI in SQLite3Adapter.new_client (sqlite3_adapter.rb:34).
- `sqlite/statement-reader.ts:13` `@noRailsEquivalent` — CONVERGEABLE approximates stmt.column_count.zero? (sqlite3/database_statements.rb:86) for drivers that expose no column metadata.

Helpers extracted from a Rails method for sharing or unit testing (`SchemaDumper#tables`, `table_options`' SHOW CREATE TABLE parse, `encrypts`' raise) and two sqlite driver shims.

## Acceptance criteria

- [ ] Each of the 5 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
