---
title: "Retire Table#_require: call the schema statement directly, as Rails does"
status: done
updated: 2026-08-19
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6737
claim: "2026-08-19T12:59:17Z"
assignee: "wave-4c-ar-core-residue-transactions-and-core"
blocked-by: null
closed-reason: null
---

# Retire `Table#_require`: call the schema statement directly, as Rails does

## Context

Surfaced while converging the call-set rows in PR #6718 (RFC 0106 wave 4b).

`Table` in `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`
routes most of its delegations through an invented private helper:

````ts
private _require<K extends keyof SchemaStatementsLike>(
  method: K,
): NonNullable<SchemaStatementsLike[K]> {
  const fn = this._schema[method];
  if (!fn) throw new Error(`${method} is not supported by the current schema backend`);
  return fn;
}
```ts

Rails has no such helper. Every one of these is a plain `@base.<method>(name, ...)`
call in `activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb`
(the `Table` class, roughly :770-940) — `@base` is the adapter with `SchemaStatements`
mixed in, so the method is always there and there is nothing to guard.

The indirection also hides the call from the call-set gate: a `this._require("addForeignKey").call(...)`
records as `_require`, not `addForeignKey`, so each site is a latent
`call-mismatches` row.

PR #6718 converged four of these sites — `change` / `change_default` / `change_null`
/ `remove_references` (`schema_definitions.rb:797-889`) — by making
`changeColumn` / `changeColumnDefault` / `changeColumnNull` non-optional on
`SchemaStatementsLike` and calling `this._schema.<method>(...)` directly. That
landed green, which is the proof the same move works for the rest.

Remaining `_require` sites (all in the same file):

```text
columnExists  indexExists  renameIndex  removeTimestamps
addForeignKey  removeForeignKey  foreignKeyExists
addCheckConstraint  removeCheckConstraint  checkConstraintExists
````

## Converged shape

For each: drop the `?` from the member on `SchemaStatementsLike`, replace
`this._require("x").call(this._schema, this.name, ...)` with
`this._schema.x(this.name, ...)`, then delete `_require` once the last caller
is gone. Keep the argument order Rails uses.

## Acceptance criteria

- [ ] `_require` is deleted; no caller remains.
- [ ] Every converted site passes exactly what the Rails `Table` method passes.
- [ ] `pnpm typecheck` green — any implementer of `SchemaStatementsLike` that
      lacks a now-required member gets the real method, not a re-added `?`.
- [ ] `pnpm parity:api:calls` / `:args` green; any row that stops flagging is
      deleted by hand and its shard tightened. No reseed.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
