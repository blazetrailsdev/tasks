---
title: "extract-pg-referential-integrity"
status: ready
updated: 2026-06-22
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails keeps PostgreSQL's referential-integrity methods in a dedicated module,
`activerecord/lib/active_record/connection_adapters/postgresql/referential_integrity.rb`
(`ActiveRecord::ConnectionAdapters::PostgreSQL::ReferentialIntegrity`), which is
mixed into `PostgreSQLAdapter`. Its public surface is
`disable_referential_integrity` and `check_all_foreign_keys_valid!`.

The trails port mirrors that file at
`packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts`,
but it is interface-only plus SQL helpers: the
`ReferentialIntegrity` interface (`disableReferentialIntegrity`,
`checkAllForeignKeysValidBang`), the `disableReferentialIntegritySql` /
`enableReferentialIntegritySql` host functions, and the
`CHECK_ALL_FOREIGN_KEYS_SQL` constant. The two **method implementations**
themselves still sit inline in the adapter:

- `disableReferentialIntegrity` — `postgresql-adapter.ts:3843`
  (doc comment from `:3836`).
- `checkAllForeignKeysValidBang` — `postgresql-adapter.ts:3891`
  (doc comment from `:3888`).

(Predecessor story `extract-pg-schema-statements-fks`, PR 3331, extracted the
SQL helpers into `referential-integrity.ts` and noted these methods belong here
rather than in schema-statements; it left the method bodies inline.)

This story is pure code motion: move the two method bodies out of the adapter
into the mirrored `postgresql/referential-integrity.ts` module (host-interface
functions per the CLAUDE.md mixin convention — they reach adapter-private state
via `this.transaction`, `this.execute`, `this.tables`, savepoint helpers — so
class extraction is not appropriate), leaving the adapter delegating. No
behavior change; the existing
`packages/activerecord/src/adapters/postgresql/referential-integrity.test.ts`
is the safety net.

## Acceptance criteria

- [ ] `disableReferentialIntegrity` and `checkAllForeignKeysValidBang`
      implementations live in `postgresql/referential-integrity.ts`; the
      adapter only delegates to them.
- [ ] No behavior change: no test edits beyond import paths;
      `referential-integrity.test.ts` and the PG suite stay green.
- [ ] PR diff under the 500 LOC ceiling (code motion counts double).
