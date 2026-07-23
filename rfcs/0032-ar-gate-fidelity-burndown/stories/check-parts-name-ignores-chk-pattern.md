---
title: "checkParts dumps auto-generated chk_rails_* names, ignoring chkIgnorePattern"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5156
claim: "2026-07-23T16:22:35Z"
assignee: "check-parts-name-ignores-chk-pattern"
blocked-by: null
closed-reason: null
---

## Context

Sibling of pg-export-name-ignores-dumper-patterns (PR #5149), found during its
post-merge review. Rails `SchemaDumper#check_constraints_in_create` gates the
`name:` option on `check.export_name_on_schema_dump?`
(vendor/rails/activerecord/lib/active_record/schema_dumper.rb:311), which
applies `SchemaDumper.chk_ignore_pattern`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:185-187).

Trails `checkParts` (packages/activerecord/src/schema-dumper.ts:1046-1051)
pushes `name:` whenever `check.name` is set. The
`CheckConstraintDefinition.isExportNameOnSchemaDump` getter exists
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:351)
but is never consulted on the dump path, so auto-generated `chk_rails_*` check
constraint names dump instead of being omitted. The FK path already delegates
correctly (schema-dumper.ts:1085-1088) — mirror that shape.

## Acceptance criteria

- `checkParts` (or its caller) gates `name:` on the constraint's
  export-name check, delegating to `isExportNameOnSchemaDump` when the object
  provides it and falling back to `chkIgnorePattern` otherwise, as the FK path
  does.
- A dumper-level test shows an auto-named `chk_rails_[0-9a-f]{10}` constraint
  dumps without `name:` while an explicitly named one keeps it.
