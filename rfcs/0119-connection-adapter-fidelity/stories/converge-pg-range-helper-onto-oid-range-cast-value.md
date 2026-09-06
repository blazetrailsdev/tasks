---
title: "converge-pg-range-helper-onto-oid-range-cast-value"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7562
claim: "2026-09-06T15:58:15Z"
assignee: "converge-pg-range-helper-onto-oid-range-cast-value"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/pg-range.ts` re-derives range
parsing that `connection-adapters/postgresql/oid/range.ts` already ports from
`activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb`
(`RangeType#cast_value`, `:47-65`) — it even imports that file's
`findRangeSeparator` and `unquoteRangeBound` and then re-implements the body
around them.

`parseRange` has exactly one consumer, `adapters/postgresql/range.test.ts`,
which calls it as `parseRange(str, castFn)`. The ported
`RangeType#castValue` is the method Rails uses for the same job; the test should
construct a `RangeType` over its subtype and call it.

`serializeRange` and its private `quoteRangeBound` were dead and are deleted by
`receipt-connection-adapters-and-sqlite-drivers` (RFC 0130); `parseRange` carries
a `@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- `adapters/postgresql/range.test.ts` goes through `RangeType#castValue`
  (`oid/range.rb:47`), with no behavioral change to the test's assertions.
- `packages/activerecord/src/adapters/postgresql/pg-range.ts` is deleted.
- `pnpm parity:api:extra --package activerecord --novel-only` no longer lists
  `adapters/postgresql/pg-range.ts`, and the mark is tightened.
- The PostgreSQL adapter lane stays green.
