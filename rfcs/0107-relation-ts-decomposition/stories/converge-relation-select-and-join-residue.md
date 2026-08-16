---
title: "Converge _isKnownColumn/_promotedIncludes/joinDependencyFallback"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6616
claim: "2026-08-16T22:53:03Z"
assignee: "converge-relation-select-and-join-residue"
blocked-by: null
closed-reason: null
---

## Context

Coverage gap from the 2026-08-16 refinement pass. The **select / join residue** —
three small invented helpers left over once the join-resolver and eager-cluster
stories take their share:

| member                   | `relation.ts` | lines | note                                                                                                                                                                                |
| ------------------------ | ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_isKnownColumn`         | `:3895`       | 15    | column-existence probe with no Rails counterpart; Rails resolves through `arel_columns` (`query_methods.rb:1662`) and the type map                                                  |
| `_promotedIncludes`      | `:2577`       | 14    | part of the includes→eager_load promotion path; Rails does this in `eager_loading?` (`relation.rb:1238`) + `references_eager_loaded_tables?` (`relation.rb:1474`)                   |
| `joinDependencyFallback` | `:5067`       | 12    | returns a closure resolving a join-dependency table name to its model — Rails threads this as the `associated_table` block from `build_where_clause` (`predicate_builder.rb:71-73`) |

~41 lines.

Small enough that it could ride along with `retire-relation-parallel-join-resolver`
(~500 lines) if the agent claiming that story has room under the ceiling —
noted here so it is tracked either way rather than falling through the gap
again.

`joinDependencyFallback` already carries an explanatory comment at
`relation.ts:5059-5066` naming `predicate_builder.rb:71-73` as the Rails shape
it stands in for, which is the citation to converge against.

`_promotedIncludes` overlaps the promotion helpers the eager-cluster story owns
(`_includesToPromoteFromReferences`, `_joinedIncludesValues`) — check that story
has not already absorbed it before starting.

## Acceptance criteria

- `_isKnownColumn` is retired in favour of `arel_columns`
  (`query_methods.rb:1662`) + the type map, or tagged with a reason.
- `_promotedIncludes` is folded into the `eager_loading?` /
  `references_eager_loaded_tables?` bodies (`relation.rb:1238`, `:1474`), or
  confirmed already handled by `converge-apply-join-dependency-eager-cluster`
  and this bullet dropped.
- `joinDependencyFallback` is threaded as Rails threads `associated_table`
  from `build_where_clause` (`predicate_builder.rb:71-73`).
- No behavior change; the `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
