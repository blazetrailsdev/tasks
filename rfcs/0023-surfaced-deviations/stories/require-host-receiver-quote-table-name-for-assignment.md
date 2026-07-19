---
title: "Require a host receiver on quoteTableNameForAssignment"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced by #4958 (`require-host-receiver-quote-table-name-default-expression`),
which made `this` required on the abstract/PG/SQLite `quoteTableName` and
`quoteDefaultExpression`. It left one sibling in the same deviation class.

`packages/activerecord/src/connection-adapters/abstract/quoting.ts`
`quoteTableNameForAssignment(table, attr)` takes **no** `this` at all, so it
cannot self-dispatch. #4958 had to bind a bare host at the call site:

```ts
return quoteTableName.call({}, `${table}.${attr}`);
```

Rails has it as a self-dispatching instance method
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:157`):

```ruby
def quote_table_name_for_assignment(table, attr)
  quote_table_name("#{table}.#{attr}")
end
```

MySQL's override depends on that dispatch (`abstract-mysql-adapter.ts:408` already
routes through `this.quoteTableName` for exactly this reason), so the module-level
port is the odd one out.

Not folded into #4958 because converging it breaks receiver-less callers that are
outside that story's scope:

- `packages/activerecord/src/quoting.test.ts:132`
- `packages/activerecord/src/connection-adapters/postgresql/quoting.test.ts:223`
- `packages/activerecord/src/sanitization.ts` `ABSTRACT_QUOTER.quoteTableNameForAssignment`
  (currently inlines `"table"."attr"` rather than dispatching, with a comment
  explaining it cannot use the throwing abstract path)

## Acceptance criteria

- `quoteTableNameForAssignment` takes `this: QuotingDispatchHost` and dispatches
  via `quoteTableName.call(this, ...)`, so a receiver-less call is a compile error.
- The three callers above bind a host explicitly; `ABSTRACT_QUOTER` keeps its
  current ANSI output (no behavior change to sanitization).
- Quoting + sanitization suites pass; api:compare / test:compare delta non-negative.
