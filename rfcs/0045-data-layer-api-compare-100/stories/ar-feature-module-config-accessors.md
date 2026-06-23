---
title: "ar-feature-module-config-accessors"
status: ready
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: ar-config
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A set of activerecord feature modules each declare 1–4 `class_attribute`
config accessors (reader + `=` writer + `?` predicate) that trails stores under
a different name or hardcodes. These files are disjoint (no overlap with
base/core/model-schema), so they cluster into one story:

- `reflection.ts` (112/119): `_reflections`/`=`/`?`, `aggregate_reflections`/`=`/`?`,
  `inverse_updates_counter_cache?` —
  `vendor/rails/activerecord/lib/active_record/reflection.rb:11-12`.
- `nested-attributes.ts`: `nested_attributes_options`/`=`/`?`.
- `normalization.ts`: `normalized_attributes`/`=`/`?`.
- `signed-id.ts`: `signed_id_verifier_secret`/`=`/`?`.
- `counter-cache.ts`: `_counter_cache_columns`/`=`/`?`.
- `readonly-attributes.ts`: `_attr_readonly`/`=`/`?`.
- `locking/optimistic.ts`: `lock_optimistically`/`=`/`?`.
- `log-subscriber.ts`: `backtrace_cleaner`/`=`/`?`.
- `token-for.ts`: `token_definitions`/`=`, `generated_token_verifier`/`=`.
- `attribute-methods/serialization.ts`: `default_column_serializer`/`=`/`?`.
- `scoping.ts`: `default_scope_override`.

All are `class_attribute`-generated; trails holds the equivalent state in
private fields or computes it.

## Acceptance criteria

- For each file, expose the named class-attribute accessor triple on the host
  (mapping to trails' existing state) OR add a `SKIP_GROUPS` entry with a reason
  ("`class_attribute :X` realized as private field `_x` / `?` predicate has no
  trails caller"). Verify against each Rails module before skipping.
- `inverse_updates_counter_cache?` (reflection) resolved (ported or skip with
  reason).
- `pnpm api:compare --package activerecord` shows all listed files at 100%.
