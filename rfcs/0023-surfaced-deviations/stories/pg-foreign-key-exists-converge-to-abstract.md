---
title: "PG foreignKeyExists uses bespoke information_schema query and narrowed signature vs Rails abstract"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3797
claim: "2026-06-21T14:38:44Z"
assignee: "pg-foreign-key-exists-converge-to-abstract"
blocked-by: null
---

## Context

Surfaced during PR #3331 (extract-pg-schema-statements-fks). Rails PostgreSQL
`schema_statements.rb` does NOT override `foreign_key_exists?` — it inherits the
abstract version (abstract/schema_statements.rb:1237), which computes from
`foreign_keys(from_table)` and accepts `(from_table, to_table = nil, **options)`
(supporting `column:`/`name:` lookups).

The TS `PostgreSQLSchemaStatements.foreignKeyExists` instead:

- runs a bespoke `information_schema.table_constraints` /
  `referential_constraints` COUNT query, and
- narrows the signature to `(fromTable: string, toTable: string)` — no
  `options` (column/name) support.

This is a behavioral + layout deviation: it lives in the PG class where Rails
has no PG override, and drops the options-based lookups. Converging to the
abstract `foreign_keys`-based implementation should be evaluated carefully —
the bespoke query may handle cross-schema / search_path cases differently, so
confirm parity before removing it.

## Acceptance criteria

- [ ] Decide: converge PG `foreignKeyExists` to the abstract
      `foreign_keys`-based implementation (Rails layout), OR document a
      justified PG-specific override with the cross-schema rationale.
- [ ] Restore the full Rails signature `(fromTable, toTable?, options?)` with
      `column`/`name` support.
- [ ] No test-name changes; verify on all three adapters.
