---
title: "Serialize SqlTypeMetadata through the Column encode_with path, not toJSON"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: trails#8033
claim: "2026-09-24T13:35:28Z"
assignee: "point-value-converges-onto-active-record-point"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
`connection-adapters/sql-type-metadata.ts`, `postgresql/type-metadata.ts` and
`mysql/type-metadata.ts` each define `toJSON()`, used to write a column's
metadata into the schema-cache dump. Rails defines no serializer on these
classes (`sql_type_metadata.rb`, `postgresql/type_metadata.rb`,
`mysql/type_metadata.rb`): Psych dumps their ivars by default, and
`Column#encode_with` / `init_with` (`column.rb`) carry `sql_type_metadata`
through. Prior art `converge-column-encode-with-init-with` (done) converged
the `Column` side; the metadata side still goes through `toJSON`.

## Acceptance criteria

- The schema-cache dump reaches type metadata through the same ivar-dump path
  `Column` uses (`encode_with` / `init_with` or the YAML coder's default
  object arm), and the three `toJSON` methods are deleted.
