---
title: "Delete the MySQL quote override — Rails' mysql/quoting.rb has none"
status: closed
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of mysql-quote-override-absent-in-rails, which predates it and carries the fuller Rails anchoring (the non-finite-Float arm history as well as the String/Symbol arms). Filed mid-flight on PR #6288 before spotting the existing row; keep the older story."
---

## Context

Rails' MySQL adapter has **no** `quote` override: `mysql/quoting.rb` defines only
`quote_column_name` / `quote_table_name` / `cast_bound_value` (and the
boolean-literal helpers). MySQL value quoting comes entirely from the abstract
`quote` plus the dispatched `quote_string` / `quoted_binary` /
`quoted_date` overrides.

After PR (this bundle), trails'
`packages/activerecord/src/connection-adapters/mysql/quoting.ts` `quote` is a
pure one-line delegation:

```ts
export function quote(this: QuotingDispatchHost, value: unknown): string {
  return abstractQuote.call(this, value);
}
```

and `AbstractMysqlAdapter#quote` (`connection-adapters/abstract-mysql-adapter.ts:301`)
is a matching `return mysqlQuote.call(this, value)`. Both are extra surface with
no Ruby counterpart — the String/Symbol arms that used to justify them are gone
now that the abstract `quote` self-dispatches `quote_string`
(`abstract/quoting.rb:75-76`).

## Scope

Delete `quote` from `mysql/quoting.ts` and the `override quote` on
`AbstractMysqlAdapter`, so MySQL inherits `AbstractAdapter#quote` exactly as
Rails does. Update the two trails-only tests that import the standalone
(`connection-adapters/abstract-mysql-adapter.test.ts:11` and `:327`) to exercise
the adapter's inherited `quote` instead.

## Acceptance criteria

- [ ] `mysql/quoting.ts` exports no `quote`; `AbstractMysqlAdapter` has no
      `quote` override.
- [ ] MySQL literals render identically (strings backslash-escaped, dates
      microsecond-capped via `quotedDate`, booleans `TRUE`/`FALSE`).
- [ ] `pnpm parity:api:extra --package activerecord` loses the two rows; parity:api /
      parity:test delta non-negative.
- [ ] MySQL/MariaDB CI green.
