---
title: "Adapter override assignments are class fields, not prototype methods (Rails uses def)"
status: draft
updated: 2026-07-20
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

Surfaced in review of PR #5000 (`abstract-quote-boolean-arms-self-dispatch`).
That PR converged `unquotedTrue`/`unquotedFalse`, but the same shape remains on
the sibling overrides.

Rails declares adapter quoting/DDL overrides with `def`, i.e. as **methods on the
class**. trails assigns several as class **fields** (`override x = fn;`), which
land on the _instance_, not the prototype:

- `connection-adapters/abstract-mysql-adapter.ts:387-389` —
  `override quoteIdentifier = mysqlQuoteIdentifier;`,
  `override quoteTableName = mysqlQuoteTableName;`,
  `override quoteColumnName = mysqlQuoteColumnName;`.
  Rails: `mysql/quoting.rb` `def quote_table_name` / `def quote_column_name`.
- `connection-adapters/postgresql-adapter.ts:4264` —
  `override disableReferentialIntegrity = disableReferentialIntegrity;`.
  Rails: `postgresql/referential_integrity.rb` `def disable_referential_integrity`.

Two consequences:

1. **Self-dispatch silently degrades.** Helpers that dispatch through the
   receiver (`dispatchQuotedBinary`, `dispatchQuotedTrue`, `quoteTableName`'s
   `this.quoteColumnName` at `abstract/quoting.ts:90-95`) test
   `typeof host.x === "function"` and fall back to the module-level default when
   the field is absent. Any receiver derived from the prototype alone
   (`Object.create(Adapter.prototype)`) therefore gets the **abstract** value
   with no error — a plausible wrong result, not a crash.
2. **It already cost a debugging cycle.** In #5000 the MySQL boolean pair had
   this exact shape; the test host needed an `Object.assign(Object.create(...))`
   workaround until the pair was converted to methods. The converted pair
   (`abstract-mysql-adapter.ts:390-401`) is the reference for this change; the
   sibling adapter, `sqlite3-adapter.ts:1058-1071`, already uses methods
   throughout.

The `static override abstractClass = true` occurrences in test files are genuine
fields (Rails class attributes) and are **not** in scope.

## Acceptance criteria

- [ ] The four listed `override x = fn;` assignments become prototype methods
      (`override quoteTableName(name: string): string { return mysqlQuoteTableName(name); }`),
      matching Rails' `def` and the already-converged pair at
      `abstract-mysql-adapter.ts:390-401`.
- [ ] Any test host built as `Object.assign(Object.create(Proto), {...})` purely
      to compensate collapses back to a bare `Object.create(Proto)`.
- [ ] A regression guard asserts a prototype-derived host resolves these through
      the adapter override rather than the abstract fallback.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Check for unbound references (`const f = a.quoteTableName; f(x)`) before
converting — all known consumers invoke as calls, but re-verify per symbol.
Related: `adapter-typecast-delegate-to-abstract-super` (draft) touches the same
adapters; sequence to avoid overlap.
