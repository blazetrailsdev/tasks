---
title: "Retire the @values sidecar stores (_rawOrderClauses, _distinctOnColumns, _manualReferences)"
status: done
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps:
  - drop-relation-distinct-on-invented-surface
deps-rfc: []
est-loc: 250
priority: 8
pr: 6761
claim: "2026-08-20T03:52:32Z"
assignee: "port-with-connection-acquisition-seam-for-the-arel-reader"
blocked-by: null
closed-reason: null
---

## Context

Rails keeps every relation value in `@values`, keyed by
`Relation::VALUE_METHODS` (`vendor/rails/activerecord/lib/active_record/relation.rb:54-65`).
PR #6600 restored that hash, but three trails-only stores still sit BESIDE it
because they are not `VALUE_METHODS` keys:

| trails sidecar       | the `@values` key it shadows | Rails equivalent                                                                                                                    |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `_rawOrderClauses`   | `:order`                     | none — Rails stores raw SQL orderings as `Arel::Nodes::SqlLiteral` inside `order_values`                                            |
| `_distinctOnColumns` | `:distinct`                  | none — PG `DISTINCT ON` is not a Rails value method                                                                                 |
| `_manualReferences`  | `:references`                | none — Rails distinguishes SqlLiteral-derived refs from bare strings by NODE TYPE inside `references_values`, not by a second array |

(The fourth sidecar, `_joinClauses`, is already covered by
`retire-relation-parallel-join-resolver` in this RFC — do not duplicate it here.)

Because they live outside the hash, `relation_with` (`spawn_methods.rb:71-74`),
which in Rails is a wholesale `@values` replacement, cannot reset them. #6600
had to keep machinery Rails does not have to compensate
(`packages/activerecord/src/relation/query-methods.ts`):

- `SIDECAR_BACKED_KEYS` plus the `for (const scope of SIDECAR_BACKED_KEYS)`
  loop in `setValues`, which exists only to clear the sidecars a dropped key
  can no longer clear.
- The residual `switch` in `resetValueForScope`, whose whole body is sidecar
  clearing — Rails' `unscope!` is just `@values.delete(scope)`.

## Converged shape

Rails' `unscope!` reset and `relation_with` in full:

```ruby
# query_methods.rb — unscope!
@values.delete(scope)

# spawn_methods.rb:71-74
def relation_with(values)
  result = spawn
  result.instance_variable_set(:@values, values)
  result
end
```

With the sidecars gone, `resetValueForScope` collapses to the `delete` line and
`setValues` to the single assignment — no `SIDECAR_BACKED_KEYS`, no switch.

Per-store target:

- `_rawOrderClauses` → store raw SQL orderings as `Nodes.SqlLiteral` in
  `orderValues`, as Rails does (`order_values` already holds SqlLiteral nodes;
  `value-accessor-semantics.test.ts` pins that reader behaviour today).
- `_manualReferences` → discriminate on node type within `referencesValues`
  (`column_references` / `arel_column_with_table` produce SqlLiteral; an
  explicit `.references("x")` produces a bare String), rather than a parallel
  array. NB `0023-surfaced-deviations/aliasable-references-excludes-manual-references`
  already tracks the aliasing consequence — coordinate, do not duplicate.
- `_distinctOnColumns` → PG-only surface with no Rails value method; decide
  between folding it into `@values` under a trails-owned key or moving it to the
  PG adapter layer. This arm may need its own follow-up if it cannot converge.

## Acceptance criteria

- `_rawOrderClauses` and `_manualReferences` are gone; their information lives
  in `orderValues` / `referencesValues` the way Rails carries it.
- `_distinctOnColumns` is either folded in or explicitly re-scoped with a
  filed follow-up; do not leave it as an unexplained sidecar.
- `SIDECAR_BACKED_KEYS` and the sidecar loop in `setValues` are deleted;
  `resetValueForScope` is `delete (host._values)[scope]` and nothing else.
- `structurallyIncompatibleValuesFor` drops any sidecar-specific comparison it
  still carries beyond the `_joinClauses` one owned by
  `retire-relation-parallel-join-resolver`.
- No behavior change: `pnpm vitest run packages/activerecord/src/relation` and
  the association suites pass unchanged.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
