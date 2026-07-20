---
title: "Converge temporalToBindString bind paths onto adapter quoted_date/quoted_time"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4998 (`type-casted-binds-payload-self-dispatch`).

Rails has no bind-formatting helper: `type_cast` dispatches date/time values
through `self.quoted_date` / `self.quoted_time` (`abstract/quoting.rb:103-104`),
so the adapter's own override is the single formatter.

trails has a parallel one — `temporalToBindString`
(`connection-adapters/abstract/database-statements.ts:1271`) — which takes a
`"sqlite" | "postgres" | "mysql"` dialect argument and re-implements the
dialect-specific formatting that `quotedDate` / `quotedTime` already do
(microsecond capping for MySQL, BC suffix and infinity sentinels for PG, the
2000-01-01 time prefix for SQLite).

PR #4998 removed it from the `type_casted_binds` payload path — that slot now goes
through the adapter-dispatched `Quoting#typeCastedBinds` — but deliberately left
it on the real bind paths, where it still has callers:

- `postgresql-adapter.ts:3582` (`_bindForPg`)
- `mysql2-adapter.ts:929`
- `base.ts:352` (`quoteSqlValue`, the inline `insert_all` VALUES path)

So two formatters coexist: the adapter's `quotedDate`/`quotedTime` and this
dialect-switched helper. They agree today (pinned by
`type-casted-binds-payload.trails.test.ts`, "routes Temporal binds through the
adapter's quoted_date"), but nothing enforces it, and the dialect argument is
the tell — Rails resolves dialect by receiver, not by a parameter.

## Acceptance criteria

- [ ] The remaining `temporalToBindString` call sites dispatch through the
      adapter (`this.typeCast` / `this.quotedDate` / `this.quotedTime`) so
      dialect is resolved by receiver, per `abstract/quoting.rb:103-104`.
- [ ] `temporalToBindString` is deleted, or reduced to a shared leaf helper the
      adapter `quotedDate`/`quotedTime` overrides call — not a second dispatcher
      with its own dialect switch.
- [ ] PG infinity-sentinel handling (`database-statements.ts:1285-1287`) is
      preserved wherever it moves; the sentinels are `Number.+/-Infinity`, so
      they pass `type_cast`'s numeric arm untouched today.
- [ ] Verified on SQLite, PG and MySQL — datetime/precision suites plus
      `insert_all`, which reaches this via `Base.quoteSqlValue`.
