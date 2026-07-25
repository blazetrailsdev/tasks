---
title: "misc arity gaps: insert_all, model_schema, relation, schema_dumper, token_for, type, result, encryption"
status: draft
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps:
  [
    "arity-skip-ruby-delegate-entries",
    "arity-collapse-required-kwargs-into-options-object",
    "arity-resolve-ts-alias-bindings-to-target-params",
  ]
deps-rfc: []
est-loc: 300
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remaining genuine signature gaps from `output/arity-mismatches.json` outside
the associations and internal_metadata clusters (all need per-item
verification against `vendor/rails/activerecord/` — use `pnpm rails:find`):

- `verify_attributes(attributes)` — `insert_all.rb`; TS `()` in
  `packages/activerecord/src/insert-all.ts`.
- `derive_join_table_name(first_table, second_table)` — `model_schema.rb`;
  TS `()` in `packages/activerecord/src/model-schema.ts`.
- `preload_associations(records)` — `relation.rb`; TS `()` in
  `packages/activerecord/src/relation.ts`.
- `tables(stream)` — `schema_dumper.rb`; TS `()` in
  `packages/activerecord/src/schema-dumper.ts`.
- `resolve_token(token)` — `token_for.rb`; TS `(token, finder)` in
  `packages/activerecord/src/token-for.ts`.
- `encoded(value)` — `type/serialized.rb`; TS `(serialized, value)` in
  `packages/activerecord/src/type/serialized.ts`.
- `column_type(name, index, type_overrides)` — `result.rb`; TS
  `(name, index, typeOverrides, columnTypes)` in
  `packages/activerecord/src/result.ts`.
- `generate_iv(cipher, clear_text)` / `generate_deterministic_iv(clear_text)`
  — `encryption/cipher/aes256_gcm.rb`; TS threads `keyBuf`/`deterministic`
  extra params in
  `packages/activerecord/src/encryption/cipher/aes256-gcm.ts`.
- `determine_owner_name(owner_name, config)` —
  `connection_adapters/abstract/connection_handler.rb`; TS `(owner)`.
- `remove_column(name)` — `connection_adapters/abstract/schema_definitions.rb`
  Table#remove_column vs TS `(tableName, columnName, _type?, options?)` —
  likely a wrong-method name-collision (SchemaStatements#remove_column);
  verify which definition the comparison paired and fix the pairing or the
  signature.

Beware: several reported `ts() [0-0]` ranges are first-candidate artifacts
(see arity-resolve-ts-alias-bindings-to-target-params); re-derive the real
list from a regenerated `output/arity-mismatches.json` after the tooling
stories land. Some items may turn out faithful and belong in the exclude with
a reason instead.

## Acceptance criteria

- Each listed method verified against its Rails definition and either
  converged (signature + call sites + threading), reclassified as a
  state-threading exclusion with reason, or shown to be a tooling artifact
  (noted in the story on close).
- Touched test files pass; no test renames.
- Regenerated `output/arity-mismatches.json` contains none of the listed
  entries unexcluded.
