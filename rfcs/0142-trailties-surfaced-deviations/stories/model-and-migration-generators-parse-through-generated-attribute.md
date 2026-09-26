---
title: "Model and migration generators parse through GeneratedAttribute.parse"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' model and migration generators build their attributes with
`GeneratedAttribute.parse` (`railties/lib/rails/generators/generated_attribute.rb:36-66`)
and the templates branch on its predicates: `reference?`, `rich_text?`,
`attachment?`, `attachments?`, `token?`, `password_digest?`, `virtual?`
(`activerecord/lib/rails/generators/active_record/model/templates/model.rb.tt`,
`.../migration/templates/create_table_migration.rb.tt:4-13`,
`.../migration/templates/migration.rb.tt`).

trails already ports that class (`packages/trailties/src/generators/generated-attribute.ts`,
including `passwordDigest()`, `token()`, `virtual()`), but
`model-generator.ts` parses with an invented `parseColumnsDefaultString`, and
`migration-generator.ts` with an invented `parseColumnsWithModifiers` plus
`isReference` / `isVirtual` / `VIRTUAL_TYPES`. Each template arm re-derives the
predicate inline (e.g. `col.name === "password" && col.type === "digest"`,
added in trails#8110), and the parsers skip Rails' `valid_type?` /
`valid_index_type?` / `dangerous_name?` errors (`generated_attribute.rb:45-55`).

## Acceptance criteria

- `ModelGenerator` and `MigrationGenerator` build attributes with
  `GeneratedAttribute.parse` and branch on its predicates, in template order.
- `parseColumnsDefaultString`, `parseColumnsWithModifiers`, `isReference`,
  `isVirtual` and `VIRTUAL_TYPES` are deleted.
- Unknown type / unknown index raise Rails' `Error` messages.
- Existing model/migration generator tests stay green.
