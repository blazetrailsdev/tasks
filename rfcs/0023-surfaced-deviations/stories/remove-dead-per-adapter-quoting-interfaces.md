---
title: "Remove dead per-adapter Quoting interfaces from mysql/sqlite3 quoting"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4895 (`drop-pg-quoting-boolean-literal-extras`), which
deleted PostgreSQL's dead `export interface Quoting` from
`connection-adapters/postgresql/quoting.ts` once its last members (the four
boolean-literal methods) were removed. The same trails invention still exists in
the other two adapter quoting modules:

- `packages/activerecord/src/connection-adapters/mysql/quoting.ts:31`

  ```ts
  export interface Quoting {
    unquotedTrue(): number;
    unquotedFalse(): number;
    quoteTableName(name: string): string;
    quoteColumnName(name: string): string;
  }
  ```

- `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts:24` — same
  shape plus `quotedTrue`/`quotedFalse`.

**Both are dead.** No file imports the `Quoting` _type_ from either module
(verified repo-wide; every surviving `Quoting` type reference resolves to
`connection-adapters/abstract/quoting-interface.ts`, or is the unrelated
`QuotingDispatchHost` / `QuotingMixin` / `NeedQuoting` / `QuotingTest`).

**Rails has no per-adapter `Quoting` type.** Its `module Quoting`
(`mysql/quoting.rb`, `sqlite3/quoting.rb`, `postgresql/quoting.rb`) is the
container for the methods themselves, not a separate structural contract. The
contract in trails lives at `abstract/quoting-interface.ts`, which
`connection-adapters/quoting-interface.test.ts:12` already pins on
`AbstractAdapter` at compile time — so these per-adapter duplicates add no
coverage and drift silently when the abstract surface changes.

Deleting PG's was behaviour-neutral and typecheck-verified in #4895; the same is
expected here.

## Acceptance criteria

- [ ] Delete `export interface Quoting` from `mysql/quoting.ts` and
      `sqlite3/quoting.ts`, unless an importer is found — in which case point it
      at `abstract/quoting-interface.ts` instead.
- [ ] Typecheck passes without them (this is the proof they had no consumer).
- [ ] Do NOT touch the boolean-literal _functions_ in either module — Rails
      genuinely defines `unquoted_true`/`unquoted_false` for MySQL
      (`mysql/quoting.rb:72-78`) and all four for SQLite
      (`sqlite3/quoting.rb:83-97`). This story is about the dead TS-only type
      only.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Behaviour-neutral dead-code cleanup, same shape as #4895. Small; the two
deletions are independent and non-overlapping.
