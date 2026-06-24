---
rfc: "0007-remove-global-arel-visitor"
title: "Remove the global Arel visitor — route toSql through connection.toSql"
status: active
created: 2026-05-30
updated: 2026-05-30
owner: "@deanmarano"
packages:
  - activerecord
  - arel
clusters:
  - arel-visitor
related-rfcs:
  - "0002-bootstrap-databasetasks"
---

# RFC 0007 — Remove the global Arel visitor

## Summary

Stop ActiveRecord from depending on — and "syncing" — a process-global Arel
visitor. Route every production `toSql` call through the connection's visitor
(`connection.toSql(node)`), exactly as Rails does. This makes the per-file
`beforeEach syncHandlerVisitor` dance unnecessary (no global dialect state left to
re-sync) and fixes a latent correctness bug. **Supersedes** RFC 0002's PR 0
(`visitor-on-establish`, #2600).

## Motivation

Rails has no process-global Arel visitor — each adapter owns its visitor and all
SQL compiles through that connection-bound visitor. trails already mirrors this:
`connection.toSql(node)` (`database-statements.ts:147`) is on every adapter. What
trails added on top — and Rails does not have — is a process-global fallback
(`Node#toSql()` → module-level registry visitor) that AR injects a dialect into
(`base.ts:978`, `bootstrap-test-handler.ts:45`, reset by `test-setup.ts:10`).

The per-file `beforeEach syncHandlerVisitor` exists **only** because
`test-setup.ts` keeps resetting that global. It's also a correctness bug: the
default `ToSql` visitor double-quotes identifiers, so a bare `.toSql()` on MySQL
emits wrong quoting unless the global was synced. Remove AR's dependence on the
global and both the dance and the bug evaporate.

## Design

74 production `.toSql()` calls; every sampled caller already has a
connection/adapter in scope. ~7 already do the defensive ternary
`adapter.toSql ? adapter.toSql(x) : x.toSql()` — the `: x.toSql()` arm is the
global leak to delete. The rest call `.toSql()` directly but hold a connection
right there.

**What stays:** `setToSqlVisitor` and the registry default (`ToSql`) stay in the
**arel** package — arel is dialect-agnostic and its own tests rely on the
default. What's removed is _AR injecting a dialect into that global_ and
depending on it.

## Alternatives considered

- **Install-on-establish (the #2600 / RFC 0002 PR 0 approach).** Rejected — it
  made the non-Rails global shim _more_ elaborate (install-on-establish +
  restore-on-afterEach + a new `arel-visitor-sync.ts` with no Rails analog). This
  RFC removes the global instead of growing it. #2600 is closed.
- **Leave the global, accept the dance.** Rejected — it's a real correctness bug
  (wrong quoting on adapter-less calls), not just parity tax.

## Rollout

Off `main`, ≤500 LOC each, non-overlapping files.

1. **Phase A** — route production callers through `connection.toSql`:
   [a1-ddl-metadata-callers](stories/a1-ddl-metadata-callers.md),
   [a2-persistence-base-ternary](stories/a2-persistence-base-ternary.md),
   [a3-calculations-statement-cache-insert](stories/a3-calculations-statement-cache-insert.md),
   then [a4-sweep-remaining-callers](stories/a4-sweep-remaining-callers.md).
2. **Phase B** — [b-drop-global-sync-sites](stories/b-drop-global-sync-sites.md).
3. **Phase C** — [c-collapse-into-bootstrap](stories/c-collapse-into-bootstrap.md),
   which folds into RFC 0002's PR 2/3.

Phases A/B are independent of RFC 0002 and can land first; Phase C is where they
merge.

## Open questions

1. **Adapter-less production callers.** The grep sample all had a connection;
   Phase A4's sweep must confirm the long tail. Genuine adapter-less sites stay on
   the arel default `ToSql` (acceptable — dialect-agnostic context).

## Cross-RFC notes

- **Supersedes** RFC 0002 `visitor-on-establish` (that story is marked superseded;
  the visitor concern is handled here, not by install-on-establish).
- **Subsumes** adapter-cleanup PR C (RFC 0010) — the "migrate ~35 toSql sites +
  delete `setToSqlVisitor`" work is the same initiative; tracked here.

## Stories

<!-- generated: stories table -->

| ID                                                                                                            | Title                                                                                                   | Status      | Est LOC | Cluster      |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------- | ------- | ------------ |
| [predicate-builder-force-equality-uniform-build](stories/predicate-builder-force-equality-uniform-build.md)   | Lift force_equality? to uniform build dispatch (PG array + serialized)                                  | draft       | null    | —            |
| [pg-type-cast-all-binds-not-just-object-wrappers](stories/pg-type-cast-all-binds-not-just-object-wrappers.md) | Converge pg bind type_cast to all binds (Rails type_casted_binds), gated on pinned-client serialization | ready       | null    | —            |
| [force-equality-bind-convergence](stories/force-equality-bind-convergence.md)                                 | force-equality-bind-convergence                                                                         | in-progress | null    | —            |
| [a1-ddl-metadata-callers](stories/a1-ddl-metadata-callers.md)                                                 | Phase A1 — route DDL/metadata toSql callers through connection.toSql                                    | done        | 150     | arel-visitor |
| [a2-persistence-base-ternary](stories/a2-persistence-base-ternary.md)                                         | Phase A2 — make persistence.ts + base.ts ternary callers unconditional                                  | done        | 150     | arel-visitor |
| [a3-calculations-statement-cache-insert](stories/a3-calculations-statement-cache-insert.md)                   | Phase A3 — route calculations / statement-cache / insert-all through connection.toSql                   | done        | 150     | arel-visitor |
| [a4-sweep-remaining-callers](stories/a4-sweep-remaining-callers.md)                                           | Phase A4 — sweep remaining direct .toSql() production callers                                           | done        | 100     | arel-visitor |
| [b-drop-global-sync-sites](stories/b-drop-global-sync-sites.md)                                               | Phase B — drop AR's global-visitor sync sites                                                           | done        | 80      | arel-visitor |
| [c-collapse-into-bootstrap](stories/c-collapse-into-bootstrap.md)                                             | Phase C — delete syncHandlerVisitor / beforeEach (folds into RFC 0002)                                  | done        | 50      | arel-visitor |
| [drop-default-quoter-production-reliance](stories/drop-default-quoter-production-reliance.md)                 | Drop activerecord reliance on arel default quoters — route value quoting through the connection         | done        | null    | —            |

## Changelog

- 2026-05-30: initial RFC, migrated from
  `trails/docs/activerecord/remove-global-arel-visitor-plan.md`.
