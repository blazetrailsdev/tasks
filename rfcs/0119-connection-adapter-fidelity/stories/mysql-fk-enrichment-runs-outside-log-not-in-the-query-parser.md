---
title: "mysql2's mismatched-FK enrichment runs outside log instead of inside the query_parser lambda"
status: draft
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7657, which removed mysql2's invented `_translateAndEnrich`
wrapper and routed the three call sites through Rails' own path — translation in
`with_raw_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1017`)
and the query re-stamp in `log`'s rescue (`abstract_adapter.rb:1145-1148`).

Rails resolves a `MismatchedForeignKey`'s details in exactly one place: the
`query_parser` lambda handed to the error at construction
(`abstract_mysql_adapter.rb:1010-1012`), which `MismatchedForeignKey#set_query`
calls during `log`'s rescue (`errors.rb:275-285`). That lambda runs
`mismatched_foreign_key_details`, whose last line is
`options[:primary_key_column] = column_for(match[:target_table], match[:primary_key])`
(`abstract_mysql_adapter.rb:995`) — a synchronous column lookup.

trails' `columnFor` is async, so it cannot run inside the sync `setQuery`
rebuild. #7657 left the lookup in `_enrichMismatchedForeignKey`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`),
which the three mysql2 call sites now await AROUND `this.log(...)` rather than
inside it:

```ts
try {
  return await this.log(driverSql, name, binds, typeCastedBinds, false, (payload) => ...);
} catch (e) {
  throw await this._enrichMismatchedForeignKey(e);
}
```

That is one Rails call in the wrong place plus a second rebuild of the
exception. It is strictly smaller than the wrapper it replaced (no `set_query`
pass, no `set_connection_pool` pass, no `e.cause ?? e` unwrapping), and it
carries the backtrace and `@original_message` forward the way `set_query` does —
but the placement itself is still a deviation, and the extra `catch` at three
call sites is surface Rails' `mysql2_adapter.rb` does not have.

`mysql-mismatched-fk-details-omits-primary-key-column` is BLOCKED and owns the
narrower gap (the `@missingRailsCall column_for` tag on
`mismatchedForeignKeyDetails`). This story is about the placement — where the
lookup runs and how many call sites pay for it — and should be read together
with it.

## Converged shape

Get the primary-key column lookup back inside the `query_parser` lambda, so the
enrichment disappears from the mysql2 call sites entirely and
`MismatchedForeignKey#set_query` (`errors.rb:275-285`) is again the only place a
mismatched-FK error is rebuilt.

The blocker is that `setQuery` is called synchronously from `log`'s rescue and
`columnFor` is async. Worth investigating before assuming it cannot move:

- whether the target table's columns are reliably in the schema cache by the
  time a mismatched-FK error is raised (the statement that raised it names the
  table), which would make a synchronous cached read possible;
- whether `MismatchedForeignKey` can carry an unresolved lambda that the
  three call sites no longer have to know about.

If neither works, the three `catch` blocks are the language shortcoming and
belong in CLAUDE.md as a ratified shape rather than repeated per call site.

## Acceptance criteria

- [ ] The mysql2 call sites no longer wrap `log` in a `catch` whose only job is
      the FK enrichment, OR the placement is ratified in CLAUDE.md with the
      specific sync/async constraint.
- [ ] A `MismatchedForeignKey` raised through mysql2 still carries table /
      foreign_key / target_table / primary_key / primary_key column type, its
      original message, and its backtrace.
- [ ] MariaDB lane's `adapters/mysql2/**` suites green.
