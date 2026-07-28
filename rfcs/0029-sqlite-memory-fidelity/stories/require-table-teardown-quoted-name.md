---
title: "require-table-teardown-quoted-name"
status: claimed
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-28T13:41:43Z"
assignee: "require-table-teardown-quoted-name"
blocked-by: null
closed-reason: null
---

## Context

Found while converting `adapters/sqlite3/quoting.test.ts` teardown to
`dropTable` in PR #5499 (RFC 0029).

`eslint/require-table-teardown.mjs` scans raw SQL strings for `CREATE TABLE` /
`DROP TABLE` names (`rawCreateNames` / `rawDropNames`, ~`:184`/`:205`). Its
identifier pattern stops at whitespace, so a **quoted identifier containing a
space** is truncated:

```sql
CREATE TABLE "my table" ("id" INTEGER PRIMARY KEY)   →  recorded as `my`
```

No drop can ever match, because the real table is `my table`. The rule then
reports the create as un-torn-down.

This silently shaped the code it polices: `quoting.test.ts` used to create
`"my table"` and drop `my` — balancing the rule while leaking the actual
table. That went unnoticed only because the suite ran on a throwaway
`:memory:` database. PR #5499 moved it to the ambient connection, drops the
real name, and carries an `eslint-disable-next-line` with a pointer here.

## Acceptance criteria

- [ ] `rawCreateNames` / `rawDropNames` parse a double-quoted (and
      backtick-quoted, for the MySQL suites) identifier as a single name,
      including embedded spaces.
- [ ] Unit coverage in `eslint/require-table-teardown.test.mjs` for a quoted
      name with a space, on both the create and the drop side.
- [ ] Remove the `eslint-disable-next-line blazetrails/require-table-teardown`
      and its explanatory comment from
      `packages/activerecord/src/adapters/sqlite3/quoting.test.ts`
      ("quote table name").
- [ ] Re-run the rule across the repo and confirm no other file was relying on
      the truncating behaviour to balance a create.
