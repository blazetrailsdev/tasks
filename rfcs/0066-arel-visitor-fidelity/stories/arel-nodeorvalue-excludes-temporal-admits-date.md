---
title: "NodeOrValue excludes Temporal but admits Date, inverting AR's type stance"
status: done
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5021
claim: "2026-07-21T01:20:15Z"
assignee: "arel-nodeorvalue-excludes-temporal-admits-date"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5013 (arel-ast-type-surface-excludes-model-attribute),
which admitted `ActiveModel::Attribute` into `NodeOrValue`. The identical class
of gap remains for Temporal types.

`NodeOrValue` (`packages/arel/src/nodes/binary.ts`) names `Date` but none of the
Temporal types. This is backwards relative to the rest of AR: JS `Date` is
rejected AR-wide and `Temporal` is the `Time` analogue, and `to-sql.ts` has a
5-entry Temporal whitelist it visits and quotes for real.

So the type surface admits the value AR rejects and excludes the ones it
actually handles, forcing escape casts in tests that build perfectly legal
nodes:

- `visitors/to-sql.test.ts:620` — `Temporal.Instant.from(...) as unknown as Nodes.NodeOrValue`
- `visitors/to-sql.test.ts:628` — `Temporal.PlainDate.from(...)`
- `visitors/to-sql.test.ts:656` — `value as unknown as Nodes.NodeOrValue`
- `visitors/to-sql.test.ts:675` — `Temporal.PlainDateTime.from(...)`

## Acceptance criteria

- [ ] `NodeOrValue` admits the Temporal types the visitor actually handles
      (match the existing to-sql.ts whitelist exactly — do not widen past it;
      Duration/YearMonth/MonthDay are deliberately excluded).
- [ ] The four `as unknown as Nodes.NodeOrValue` casts in
      `visitors/to-sql.test.ts` are gone.
- [ ] Decide, with a Rails citation, whether `Date` should remain in
      `NodeOrValue` at all given JS Date is rejected AR-wide.
- [ ] api:compare / test:compare delta non-negative.
