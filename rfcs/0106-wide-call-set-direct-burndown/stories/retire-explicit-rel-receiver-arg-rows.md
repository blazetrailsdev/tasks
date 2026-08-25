---
title: "module-function ports carry a leading rel the receiverless Ruby call has no slot for"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6570
claim: "2026-08-15T17:15:05Z"
assignee: "converge-with-query-connection-onto-with-connection"
blocked-by: null
closed-reason: null
---

## Context

Rails calls a private sibling on implicit self:

- `perform_calculation` → `select_for_count`, `distinct_select?(column_name)`,
  `execute_simple_calculation(operation, column_name, distinct)`,
  `execute_grouped_calculation(...)`
  (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:434-458`)
- `ids` → `type_cast_pluck_values(result, columns)` (`calculations.rb:402`)

trails ports those privates as module functions in
`packages/activerecord/src/relation/calculations.ts` that take the relation as an
explicit parameter (`selectForCount(rel)`, `typeCastPluckValues(result, columns,
rel)`). The receiverless Ruby call has no slot for it, so every such call site
reads as an argument-count mismatch. PR #6564 removed the `relation.ts` private
shims those calls used to hide behind (25 call-SET rows), which surfaced 6
call-ARGUMENT rows in their place:

```text
scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json  (5 rows, kind: args, rubyName perform_calculation)
scripts/api-compare/call-mismatches-exclude/activerecord/relation.json               (1 row,  kind: args, rubyName ids)
```

Net −19 rows, but the 6 that remain are a shape the comparator cannot see past,
not a real divergence: every argument after the leading `rel` matches Rails one
for one.

## Converged shape

Two candidate directions, to be picked during triage — this is a comparator/port-
shape problem, not a behaviour one:

1. Make the extractor treat a module function whose first (or trailing) parameter
   is the ported class's receiver as a receiverless call, the way it already folds
   an explicit Ruby receiver into arg 0 (see `execute_simple_calculation`'s
   `aggregate_column` row, which pairs Ruby `relation.aggregate_column(x)` against
   TS `aggregateColumn(relation, x)` and scores only a `naming` difference). That
   retires this whole class of row across the tree, not just these 6.
2. Or give `Relation` real `this`-typed members for these privates (CLAUDE.md's
   "Module mixins" shape) so the call sites become receiverless — but note this is
   what the deleted shims approximated, and the shim form is what generated the 25
   call-SET rows this PR retired. Do not simply restore them.

## Acceptance criteria

- [ ] The 6 `kind: "args"` rows named above are deleted, not re-justified.
- [ ] Whichever direction is taken does not reintroduce call-SET rows for
      `execute_simple_calculation` / `execute_grouped_calculation` /
      `select_for_count` / `type_cast_pluck_values` in `relation.ts`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
