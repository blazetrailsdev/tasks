---
title: "parity: map.with_index { |x, i| } ported as map((x, i) => …) is charged a missing with_index"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Enumerator#with_index` adds an index to a block-less iterator: `columns.map.with_index { |name, i| … }`. JS array methods already pass the index to their callback, so the faithful port is one call, `columns.map((name, i) => …)`. That is how trails writes it, for example `packages/activerecord/src/result.ts:206` for `result.rb:182`.

`parity:api:calls` still reports `with_index → withIndex|_withIndex` as missing for each such method. activerecord carries six of these rows today (`scripts/api-compare/output/call-mismatches.json`):

- `connection_adapters/abstract_mysql_adapter.rb` `columns_for_distinct`
- `connection_adapters/postgresql/schema_statements.rb` `columns_for_distinct`
- `encryption/cipher.rb` `try_to_decrypt_with_each` (`keys.each.with_index`, `:41`)
- `encryption/encrypted_attribute_type.rb` `try_to_deserialize_with_previous_encrypted_types`
- `relation/calculations.rb` `type_cast_pluck_values` (`columns.map.with_index`, `:615`)
- `result.rb` `cast_values` (`columns.map.with_index`, `:182`)

The comparer already credits the mirror-image chain. A block-less `each_with_index` chained into `map`, `flat_map`, `select`, `reject` or `to_a` stands for no call of its own, because the chained iterator's callback receives the index (`isEnumeratorReceiver` / `INDEXED_ENUMERATOR_CONSUMERS`, `scripts/api-compare/compare.ts:226-255`, citing `join_dependency.rb:169`). `with_index` chained after a block-less `map`, `each`, `select` or `each_with_object` is the same idiom in the other order.

Surfaced by the activerecord codegen spike: once its generator emitted the one-call form, these six rows appeared on the generated tree exactly as they appear on the hand port.

## Acceptance criteria

- [ ] `with_index` with a block, called on the result of a block-less `map`, `each`, `select`, `reject`, `flat_map` or `each_with_object`, is credited to the TS iterator call that carries the indexed callback. The iterator itself still has to be present.
- [ ] A `with_index` with an offset argument (`with_index(1)`) is not folded, since a JS callback's index always starts at 0.
- [ ] Unit tests in `scripts/api-compare/compare.test.ts`: `columns.map.with_index { }` against `columns.map((c, i) => …)` credits both calls; `with_index(1)` still reports.
- [ ] The six activerecord rows above clear on a fresh `pnpm parity:api:calls`. Any baseline row they had is deleted by hand, and the stale marks are tightened with `pnpm parity:api:calls:tighten`.

## Verification

```bash
pnpm vitest run scripts/api-compare/compare.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
