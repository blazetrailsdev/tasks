---
title: "Enforce the quoting host contract on SchemaQuoter assignment sites"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4958 (`require-host-receiver-quote-table-name-default-expression`).

That PR made `this` required on the abstract `quoteDefaultExpression`
(`this: QuotingDispatchHost & QuotingHost`). `ABSTRACT_SCHEMA_QUOTER` in
`packages/activerecord/src/connection-adapters/abstract/quoting.ts:319` assigns
that function straight to a `SchemaQuoter`-typed object literal:

```ts
export const ABSTRACT_SCHEMA_QUOTER: SchemaQuoter = {
  quoteIdentifier,
  quoteTableName: (name) => ...,
  quoteDefaultExpression,
};
```

This compiles **only** because TS method assignment is bivariant in the `this`
parameter and every `QuotingDispatchHost` member is optional. There is no
compile-time check that the quoter actually satisfies the host contract — the
stricter signature is not enforced at this boundary. It is correct at runtime
today (the object _is_ the receiver, and the optional members legitimately fall
back to the module helpers), so this is a type-safety gap, not a live bug.

The same pattern applies to `mysqlSchemaQuoter` (`mysql/schema-quoter.ts:37`),
which assigns the abstract `quoteDefaultExpression` as a property for the same
reason.

Risk: a future host that genuinely needs to supply `quote` / `quotedBinary` to
get correct dialect output can omit it and the compiler stays silent — exactly
the class of silent SQL divergence #4958 was closing.

## Acceptance criteria

- `SchemaQuoter` (or the assignment sites) express the host requirement so an
  incompatible quoter is a compile error rather than silently accepted — e.g.
  declare `quoteDefaultExpression` on `SchemaQuoter` with the matching `this`
  type, or type the quoter constants as satisfying the host contract.
- `ABSTRACT_SCHEMA_QUOTER` and `mysqlSchemaQuoter` still emit identical DDL
  (no behavior change).
- A negative type test / assertion demonstrating a host missing a required
  member no longer compiles.
