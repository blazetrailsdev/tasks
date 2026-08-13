---
title: "Drop performSum's nil-column short-circuit; resolve sum's identity/block arm"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6444
claim: "2026-08-12T23:36:53Z"
assignee: "test-compare-scans-rails-behavior-mixin-files"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6438 while removing the `isEmptyCalculationScope` guards from the
four `perform*` aggregate bodies. `performSum`
(`packages/activerecord/src/relation/calculations.ts`) still opens with a
trails-only short-circuit:

```ts
if (!column) return 0;
```

Rails' `sum` (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:186-192`)
has no such arm — `sum(identity_or_column = nil, &block)` falls through to
`calculate(:sum, identity_or_column)`, and `calculate`'s own `@none` /
`perform_calculation` path answers the nil-column case (`aggregate_column`
maps nil to `Arel.star`, calculations.rb:414-423). The trails guard also
diverges from its own siblings: `performAverage`/`performMinimum`/`performMaximum`
are now bare `calculate` calls after #6438, so `performSum` is the only one left
with a pre-`calculate` branch.

Rails' `sum` additionally has the block/identity arm
(`sum { |r| … }` over the loaded records, plus a non-column identity value),
which trails does not port at all — worth resolving in the same story since both
live in the same three lines.

## Converged shape

Drop the `if (!column) return 0` short-circuit so `performSum` is Rails'
`calculate("sum", column)` plus the JS-only return-shape normalization it already
does, and let the nil-column answer come out of `calculate` /
`aggregate_column`. Port or explicitly scope out the identity/block arm at the
same time, citing calculations.rb:186-192.

## Acceptance criteria

- [ ] `performSum` no longer short-circuits on a missing column; `Model.sum()`
      keeps its current answer through the `calculate` path.
- [ ] The identity/block arm is either ported per calculations.rb:186-192 or
      registered as its own story with the Rails citation.
- [ ] `packages/activerecord/src/calculations.test.ts` and
      `calculations.trails.test.ts` stay green; `pnpm parity:api:calls` / `:args`
      green with no new baseline rows.
