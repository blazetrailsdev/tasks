---
title: "PG sequenceNameFromParts hardcodes 63 instead of maxIdentifierLength"
status: done
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5475
claim: "2026-07-28T00:58:15Z"
assignee: "pg-sequence-name-from-parts-hardcodes-63"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the PG sequence helpers in PR #5389 (RFC 0072 story
`converge-pg-sequence-and-schema-qualified-name-helpers`).

Rails' `sequence_name_from_parts` computes its truncation budget from
`max_identifier_length`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:1007-1021`):

```ruby
over_length = [table_name, column_name, suffix].sum(&:length) + 2 - max_identifier_length
```

trails hardcodes `const maxLen = 63`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`,
`sequenceNameFromParts`). 63 is the default `NAMEDATALEN - 1`, but PostgreSQL can
be compiled with a different `NAMEDATALEN`, and `max_identifier_length` is a
real `SHOW`-backed server value.

This is now trivially fixable: `converge-pg-max-identifier-length-sync`
(RFC 0051, PR #4810) already made `maxIdentifierLength()` synchronous, so the
helper can read the real server value with no async plumbing.

The consequence of getting it wrong is not cosmetic — `sequenceNameFromParts` is
what `new_column_from_field` compares against a column's `nextval(...)` default
to decide whether a column is `serial:`, so a wrong budget mis-detects serial
columns on a non-default server and changes the dumped schema.

## Acceptance criteria

- `sequenceNameFromParts` derives its budget from `maxIdentifierLength()`
  rather than the literal 63.
- A regression test pins the truncation against a non-63 identifier length
  (stub the limit) and fails on the hardcoded implementation.
- Test names match the Rails tests if a corresponding one exists in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.
