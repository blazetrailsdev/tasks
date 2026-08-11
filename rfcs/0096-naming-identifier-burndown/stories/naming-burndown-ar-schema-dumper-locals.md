---
title: "Converge the remaining schema-dumper local/parameter names (10 naming rows)"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6371
claim: "2026-08-11T17:56:00Z"
assignee: "converge-relation-where-clause-writer"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `naming-burndown-activerecord-rest-3` and
`naming-burndown-ar-schema-dumper-stream` (#6369). The `stream` rename is done;
these are the schema-dumper `naming` rows still open in
`output/call-arg-mismatches.json` (`class === "naming"`, `package ===
"activerecord"`), each a local/parameter that should carry the Rails identifier.
Read live after #6369 merged:

- `schema-dumper.ts` `table` → `columns`: Rails `(ref:table)` vs trails
  `(ref:tableName)` — NOTE a sibling PR already renamed `table()`'s own
  parameter to `table`; this row is for the remaining `tableName` locals in the
  body (`schema_dumper.rb:158-225`).
- `schema-dumper.ts` `indexes_in_create` → `index_parts`: Rails `(ref:index)`
  vs trails `(ref:idx)` (`schema_dumper.rb:244-262`).
- `schema-dumper.ts` `check_constraints_in_create` → `check_constraints` and
  → `remove_prefix_and_suffix`: Rails `(ref:table)` vs trails `(ref:tableName)`
  (`schema_dumper.rb:283-305`).
- `schema-dumper.ts` `format_colspec` → `format_colspec`: Rails `(ref:value)`
  vs trails `(ref:v)`.
- `schema-dumper.ts` `remove_prefix_and_suffix` → `escape` (two rows): Rails
  `(ref:toS)` vs trails `(ref:prefix)` / `(ref:suffix)` — Rails calls
  `Regexp.escape(prefix.to_s)`; the trails helper takes the raw string. See
  also `schema-dumper-regexp-escape-not-a-local-helper` (0023), which retires
  the local helper entirely — that story may subsume these two.
- `connection-adapters/postgresql/schema-dumper.ts`
  `exclusion_constraints_in_create` → `exclusion_constraints` and
  `unique_constraints_in_create` → `unique_constraints`: Rails `(ref:table)`
  vs trails `(ref:tableName)` (`postgresql/schema_dumper.rb:42-81`).
- `connection-adapters/abstract/schema-dumper.ts` `create` → `new`: Rails
  `(ref:connection, ref:options)` vs trails `(ref:source, ref:options)` — see
  `retire-base-schema-dumper-create-factory` (0023), which may subsume it.

## Acceptance criteria

1. Each local/parameter above carries the Rails identifier, camelCased.
2. The rows leave the `naming` report
   (`pnpm parity:api:calls:args:report`); the activerecord `naming` total drops
   by the number converged.
3. No behaviour change; `schema-dumper.test.ts` and the dialect dumper tests
   stay green.
