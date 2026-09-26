---
title: "migration-generator-join-table-builds-from-generated-attributes"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `MigrationGenerator#set_local_assigns!`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/migration_generator.rb:26-43`)
checks `add`/`remove`, then `join_table` (only when `attributes.length == 2`), then `create_`.
For a join table it sets `@join_tables` to `attributes.map(&:plural_name)` and calls
`set_index_names` / `index_name_for` (`:45-57`), which assign each attribute's
`index_name` through `attr_writer :index_name` (`railties/lib/rails/generators/generated_attribute.rb:32`).
The `join` arm of `migration.rb.tt` then emits `t.references` for references and
`t.index <index_name><inject_index_options>` (commented out unless `has_index?`) for the rest.

After trails#8147, `packages/trailties/src/generators/migration-generator.ts` builds its
create/add/remove arms from `GeneratedAttribute.parse`, but `joinTableBody` still reads the raw
CLI args (`parts.includes("uniq")`, `name.replace(/_id$/, "")`) and throws when there are not
exactly two. Rails instead falls through to an empty `change`. The create match is also tested
before the join match, so `create_x_join_table` never reaches the join arm. `GeneratedAttribute`
has no `setIndexName` / memoized `indexName`.

## Acceptance criteria

- `GeneratedAttribute` memoizes `indexName` and gains `setIndexName` (Rails `index_name=`).
- `MigrationGenerator` ports `set_index_names` / `index_name_for`, and its join arm renders from
  the parsed attributes in `migration.rb.tt` order.
- Match order follows `set_local_assigns!`; a join-table name without exactly two attributes
  yields an empty change instead of throwing.
- "create join table migration" stays green.
