---
title: "PG addForeignKey generates fk_rails name with raw columns, not Rails SHA256 identifier"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3795
claim: "2026-06-21T14:14:41Z"
assignee: "pg-add-foreign-key-name-uses-sha256-identifier"
blocked-by: null
---

## Context

Surfaced during PR #3331 (extract-pg-schema-statements-fks). The TS
`PostgreSQLSchemaStatements.addForeignKey` defaults the constraint name to:

```ts
const name = options.name ?? `fk_rails_${fromTbl}_${column}`;
```

Rails generates it via `foreign_key_name` (abstract/schema_statements.rb:1755):

```ruby
identifier = "#{table_name}_#{options[:column]}_fk"   # actually "#{table_name}_#{options[:column]}"
hashed_identifier = OpenSSL::Digest::SHA256.hexdigest(identifier).first(10)
"fk_rails_#{hashed_identifier}"
```

i.e. `fk_rails_<first-10-hex-of-SHA256(table_column)>`, e.g.
`fk_rails_e74ce85cbc`. The TS port emits the raw `fk_rails_<table>_<column>`
instead. This produces different constraint names, which diverges from Rails
in schema dumps and any name-based FK operation (drop/validate by default
name). Pre-existing — NOT introduced by the code-motion PR.

## Acceptance criteria

- [ ] PG (and abstract, if shared) FK default name matches Rails:
      `fk_rails_<SHA256(table_"_"column).first(10)>`.
- [ ] Verify against Rails' documented examples (fk_rails_e74ce85cbc etc.).
- [ ] No test-name changes; update fixtures/snapshots only as Rails dictates.
