---
title: "Retire the _qt/_qi quoting abbreviation wrappers hiding quote_table_name/quote_column_name"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - converge-quote-identifier-into-quote-column-name
deps-rfc: []
est-loc: 400
priority: null
pr: 6110
claim: "2026-08-05T01:29:56Z"
assignee: "model-name-i18n-keys-drops-model-name-fallback"
blocked-by: null
closed-reason: null
---

## Context

Surfaced repeatedly while converging PG call sets in PR #5389 (RFC 0072 story
`converge-pg-sequence-and-schema-qualified-name-helpers`).

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
defines two abbreviation wrappers:

```ts
protected _qi(name: string): string { return this.adapter.quoteIdentifier(name); }
protected _qt(tableName: string): string { return this.adapter.quoteTableName(tableName); }
```

They are a trails invention with no Rails counterpart, and they are used
throughout the adapter schema-statement bodies. Two costs:

1. **They hide `quote_table_name` / `quote_column_name` from the wide call
   gate.** Every body that quotes via `_qt`/`_qi` reads to `parity:api:calls` as
   omitting the call Rails makes, so those entries sit in the baseline as false
   positives. PR #5389 had to inline `quoteTableName`/`quoteColumnName` at four
   call sites purely to clear them, and the same inlining is pending in every
   other schema-statements body that still uses the wrappers (~20 sites in
   `postgresql/schema-statements-class.ts` alone, plus the mysql and sqlite
   subclasses).
2. `_qi` maps to `quoteIdentifier` while Rails calls `quote_column_name`. These
   are pure synonyms today (see the existing
   `converge-quote-identifier-into-quote-column-name` story), so the wrapper
   also encodes the wrong Rails name at every call site.

Retiring the wrappers is mechanical but wide, and it should land as its own
change rather than as incidental churn inside per-cluster call-set stories —
which is how it has been leaking so far.

## Acceptance criteria

- Delete `_qi` / `_qt` from `abstract/schema-statements.ts` and replace every
  call site with `this.adapter.quoteColumnName(...)` /
  `this.adapter.quoteTableName(...)` (note `quoteColumnName`, not
  `quoteIdentifier` — coordinate with
  `converge-quote-identifier-into-quote-column-name`).
- Baseline entries for `quote_table_name` / `quote_column_name` that were only
  hidden by the wrappers drop out; `pnpm parity:api:calls` passes with a strictly
  smaller baseline.
- Likely exceeds the 500-LOC ceiling across all adapters — split by adapter,
  each PR from `main` with non-overlapping files, and register the splits as
  separate stories rather than fanning out.
