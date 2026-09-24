---
title: "Inline the ruby bodies still extracted as named helpers (0119 remainder)"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: trails#8053
claim: "2026-09-24T19:49:58Z"
assignee: "converge-adapter-schema-and-result-helper-surface-remainder"
blocked-by: null
closed-reason: null
---

## Context

`inline-ruby-bodies-extracted-as-named-helpers` (RFC 0119) is done
(trails#7402). Ten `@noRailsEquivalent CONVERGEABLE` receipts still cited it,
so no open story owned their debt. That was surfaced by trails#8004 and
re-pointed here by `retire-convergeable-receipts-citing-done-stories`. Each
name is a free function or method extracted from a Ruby body that Rails
writes inline:

- `connection-adapters/abstract-adapter.ts` `adapterNameFromConfig`
- `connection-adapters/abstract/quoting.ts` `toBytes`
- `connection-adapters/abstract/schema-definitions.ts` `splitColumnNames`
- `connection-adapters/abstract-mysql-adapter.ts` `changeColumnDefaultForAlter`
- `connection-adapters/mysql/schema-dumper.ts` `table` override (the
  `populateVirtualExpressionCache` / `populateTableCollationFromStatus` prelude)
- `connection-adapters/mysql/schema-statements.ts` `foreignKeys` (module function)
- `connection-adapters/sqlite3/schema-statements.ts` `extractValueFromDefault`
- `associations.ts` `resolveAssocClass`
- `relation/query-methods.ts` `normalizeBoundValue`, `emitJoinPlan`

Find each one's Rails caller with `pnpm rails:find <name>`. The original
story's file:line list is in
`rfcs/0119-connection-adapter-fidelity/stories/inline-ruby-bodies-extracted-as-named-helpers.md`.

## Acceptance criteria

- Each name is inlined into its Rails-named caller, or replaced by the Rails
  method it stands in for, and its receipt is deleted with it.
- `git grep "CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers-remainder"` returns nothing.
- `pnpm parity:api:extra:gate` stays green. Split by file if the LOC ceiling needs it.
