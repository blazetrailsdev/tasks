---
title: "ar-base-core-model-schema-config"
status: in-progress
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-config
deps: ["ar-feature-module-config-accessors", "ar-querying-async-finders"]
deps-rfc: []
est-loc: 250
priority: null
pr: 4060
claim: "2026-06-24T14:09:58Z"
assignee: "ar-base-core-model-schema-config"
blocked-by: null
---

## Context

The aggregator files `base.ts`, `core.ts`, and `model-schema.ts` re-expose
`class_attribute` config declared in Core/ModelSchema (and feature modules
handled by sibling stories). This story runs **last** — after the feature and
querying leaf stories — and resolves the residual base.rb/core.rb/
model_schema.rb-native config:

- `core.ts` (73/93): `default_connection_handler`/`=`/`?`, `default_role`/`=`/`?`,
  `belongs_to_required_by_default`/`=`/`?`,
  `enumerate_columns_in_select_statements`/`=`/`?`, `shard_selector`/`=`/`?`,
  `destroy_association_async_batch_size`/`=`, `_destroy_association_async_job`/`=`/`?`
  (`vendor/rails/activerecord/lib/active_record/core.rb:89,98,100,104`).
- `model-schema.ts` (47/65): `primary_key_prefix_type`/`=`/`?`,
  `pluralize_table_names`/`=`/`?`, `schema_migrations_table_name`/`=`/`?`,
  `internal_metadata_table_name`/`=`/`?`, `implicit_order_column`/`=`/`?`,
  `immutable_strings_by_default`/`=`/`?` (`model_schema.rb:163-166`). model-schema.ts
  already documents trails hardcodes some toggles (e.g. no
  `pluralize_table_names`).
- `base.ts` (415/446): the union of the above plus names owned by sibling
  stories (`_reflections`, `nested_attributes_options`, `normalized_attributes`,
  `signed_id_verifier_secret`, `async_*`, `calculate`, `except`,
  `extract_associated`) — those flip to matched once the leaf stories land, so
  base.ts should mostly clear transitively.

## Acceptance criteria

- **Depends on** `ar-feature-module-config-accessors` and
  `ar-querying-async-finders` being merged first (their names resolve base.ts
  transitively).
- Each remaining Core/ModelSchema config accessor triple exposed under the Rails
  name OR added to `SKIP_GROUPS` with a reason (e.g. "trails hardcodes
  `pluralize_table_names`; no runtime toggle"). Read each against Rails — a
  hardcoded toggle that Rails lets you set is a real divergence: if convergence
  is non-trivial, file a follow-up story rather than skip-ratifying.
- `pnpm api:compare --package activerecord` shows base.ts, core.ts,
  model-schema.ts at 100%, and **overall activerecord at 100%**.
