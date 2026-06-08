---
title: "I-1 — Epic 3.3-U3: schema-dumper columnSpec wiring"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: unblockers
deps: []
deps-rfc: []
est-loc: 120
pr: 3015
claim: "2026-06-08T00:16:41Z"
assignee: "i1-schema-dumper-columnspec-u3"
blocked-by: null
---

## Context

U2 shipped (#2864). U3 routes `emitTable` through `columnSpec` /
`columnSpecForPrimaryKey` + `formatColspecRaw`; reconciles defaults.

**Prerequisite:** switch SQLite `/char/i`, `/binary/i`, `/text/i` type-map
registrations to `register_class_with_limit` semantics (guard test already in
`schema-dumper.test.ts` "preserves explicit string limit").

## Acceptance criteria

- [ ] SQLite limit extraction switched; guard test green.
- [ ] `emitTable` routes through `columnSpec`.
- [ ] `schema_dumper_test.rb` (22), `comment_test.rb` (17), `defaults_test.rb`
      dump cases, `column_definition_test.rb` (3) un-skipped.
- [ ] Live PG/MySQL verified locally.

## Notes

Gates: schema_dumper (22), comment (17), view dump (~6), defaults, mysql_enum
dump, charset_collation dump, column_definition (3).
Ours: `connection-adapters/abstract/schema-dumper.ts`, `sqlite3-adapter.ts`.
Rails: `lib/active_record/connection_adapters/abstract/schema_dumper.rb`.
