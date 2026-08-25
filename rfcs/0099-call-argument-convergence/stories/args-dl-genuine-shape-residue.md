---
title: "Read and converge the remaining data-layer argument-shape rows"
status: done
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6823
claim: "2026-08-21T14:48:15Z"
assignee: "args-dl-adapter-factory-invented-kwarg"
blocked-by: null
closed-reason: null
---

## Context

Eight `kind: "args"` rows in the data layer that are neither dropped kwargs,
invented kwargs, receiver threading, nor `throw new` homonyms — each is a
genuine argument-list divergence needing its own read against the Ruby:

| TS file                                             | Ruby method                                      | Rails passes                                | trails passes                                                               |
| --------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------- |
| `aggregations.ts`                                   | `composed_of`                                    | `"composedOf", part_id, nil, options, self` | `"composedOf", name, nil, {anonymousClass, className, mapping}, modelClass` |
| `associations/alias-tracker.ts`                     | `create`                                         | `new(0)`                                    | `new(aliases)`                                                              |
| `associations/alias-tracker.ts`                     | `create`                                         | `new(table_alias_length, aliases)`          | `new(tableAliasLength, map, joins, quoter)`                                 |
| `associations/preloader/through-association.ts`     | `source_records_by_owner`                        | `reduce("merge")`                           | `reduce(merge, constructor)`                                                |
| `associations/preloader/through-association.ts`     | `through_records_by_owner`                       | `reduce("merge")`                           | `reduce(merge, constructor)`                                                |
| `connection-adapters/mysql2/database-statements.ts` | `cast_result`                                    | `new(fields, to_a)`                         | `new(columns, rows, columnTypes)`                                           |
| `inheritance.ts`                                    | `subclass_from_attributes`                       | `find_sti_class(subclass_name)`             | `findStiClass(modelClass, value)`                                           |
| `encryption/config.ts`                              | `support_sha1_for_non_deterministic_encryption=` | `new(hash_digest_class: SHA1)`              | `new("SHA1")`                                                               |
| `encryption/cipher/aes256-gcm.ts`                   | `generate_deterministic_iv`                      | `digest(constructor, secret, clear_text)`   | `digest()`                                                                  |

The `reduce("merge")` pair is Ruby's `inject(:merge)` — a Symbol-as-block
idiom, so it may be a conventions row rather than a defect. The alias-tracker
and `cast_result` rows look like genuinely different constructor shapes. The
`encryption/config.ts` row passes a string where Rails passes a class constant,
which is the kind of divergence that silently changes behaviour.

Split at claim time if the bundle exceeds the LOC ceiling; the association rows
and the encryption rows are independent file sets.

## Acceptance criteria

- Every row read against its vendored Ruby and either converged or given a
  reviewed one-line baseline `reason` specific to that row.
- Any row that turns out to be an invented-helper or ordering finding is filed
  against the RFC owning that file rather than renamed away here.
- Rows deleted by hand from the exclude tree; `pnpm parity:api:calls:args`
  green.
