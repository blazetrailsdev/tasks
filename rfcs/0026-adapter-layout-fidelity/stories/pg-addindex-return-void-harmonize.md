---
title: "Harmonize PG addIndex return type Promise<string> -> Promise<void>"
status: ready
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["addindexoptions-async-route-pg-addindex"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced finishing `pg-indexes-rails-fidelity` (#3340). PostgreSQL `addIndex`
(`postgresql-adapter.ts:3640`) returns `Promise<string>` (the generated SQL,
"for test/inspection purposes") whereas Rails `add_index` returns void. The
deviation is marked with a `@ts-expect-error TS2416` and a "Harmonize in a
follow-up" comment at `postgresql-adapter.ts:3638-3639`.

This is a separate concern from the `addIndexOptions` async transition (tracked
in its sibling story) because harmonizing the return type churns every caller
and test that consumes the returned SQL string — notably
`adapters/postgresql/active-schema.test.ts` ("add index", "add index quotes a
bare column name where"), which assert on the exact `CREATE INDEX ...` string.

## Scope

- Change PG `addIndex` to return `Promise<void>`, matching Rails `add_index`
  and the base `addIndex` contract; remove the `@ts-expect-error`.
- Update the PG add-index tests to assert behavior via introspection
  (`indexNameExists`, `indexes()`) or via the SQL-builder path rather than the
  method's return value. Keep test names matching Rails verbatim.
- Audit other callers of PG `addIndex` that rely on the returned SQL string and
  migrate them.

## Acceptance criteria

- [ ] PG `addIndex` returns `Promise<void>`; `@ts-expect-error TS2416` removed.
- [ ] No caller/test depends on a returned SQL string from `addIndex`.
- [ ] api:compare arity/return parity for `add_index` improves or holds;
      test:compare delta non-negative.
