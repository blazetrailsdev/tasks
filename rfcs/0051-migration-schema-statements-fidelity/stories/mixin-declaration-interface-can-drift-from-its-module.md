---
title: "Catch drift between a mixed-in SchemaStatements module and the adapter interface that declares it"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5863
claim: "2026-08-02T03:36:48Z"
assignee: "mixin-declaration-interface-can-drift-from-its-module"
blocked-by: null
closed-reason: null
---

## Context

PR #5844 mixed `PostgreSQL::SchemaStatements` into `PostgreSQLAdapter`. Because
`include()` installs methods on the prototype at runtime, TypeScript cannot see
them on the class type, so the PR added a declaration-merged
`export interface PostgreSQLAdapter { ... }` at the bottom of
`connection-adapters/postgresql-adapter.ts` restating ~85 signatures of
`postgresql/schema-statements-class.ts`.

Nothing keeps the two in sync. Change a signature in the mixin class and the
adapter's declared type silently goes stale: the interface is merged, not
checked against the class, and the runtime method comes from the prototype
either way. The failure mode is a call site typechecking against a signature
that no longer exists.

The obvious fix — `Included<PostgreSQLSchemaStatements>` from
`@blazetrails/activesupport` — does NOT work: for a class module `keyof` resolves
to `string`, so the mapped type yields `{}` with no error and every call site
silently falls back to `AbstractAdapter`'s base signature. `Included<>` is built
for plain-object modules. That trap cost real time on #5844 and is why the
signatures are hand-written.

`AbstractAdapter` has the same shape (`abstract-adapter.ts:209`) for its own
`include SchemaStatements`, so a fix here covers both.

## Acceptance criteria

- Drift between a mixin class's public methods and the adapter interface that
  declares them is caught automatically — either a test/lint that diffs the two,
  or a generated declaration.
- Covers both `PostgreSQLAdapter`/`PostgreSQLSchemaStatements` and
  `AbstractAdapter`/`SchemaStatements`.
- A deliberately-mismatched signature fails the new check (regression must fail
  on the baseline).
