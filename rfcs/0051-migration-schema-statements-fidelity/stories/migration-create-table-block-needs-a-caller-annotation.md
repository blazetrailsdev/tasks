---
title: "Migration#createTable's block still needs a caller annotation and a contravariance cast"
status: ready
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shipped as a documented deviation in PR #7093 (RFC 0051 story
`migration-create-table-callback-yields-abstract-table-definition`). That story
removed the `(t as PgTableDefinition)` cast at
`packages/activerecord/src/adapters/postgresql/enum.test.ts:339` by making
`Migration#createTable` / `#createJoinTable` generic in the definition type:

```ts
async createTable<TD extends TableDefinition = TableDefinition>(
  name: string,
  optionsOrFn?: { ... } | ((t: TD) => void),
  fn?: (t: TD) => void,
): Promise<void>
```

The cast at the call site is gone, but two residues remain, both recorded in
`migration.ts`'s JSDoc rather than swept under a baseline:

1. **The caller must annotate.** `TD` is inferred from the block's own parameter
   annotation, so a PG migration writes `(t: PgTableDefinition) => ...`. Ruby
   needs nothing: `Migration#method_missing` forwards to the connection
   (`vendor/rails/activerecord/lib/active_record/migration.rb:1024-1036`) and
   resolves `t.enum` / `t.citext` on the yielded definition when the block runs.
2. **The forward carries a cast.** `Migration` names only the abstract
   `DatabaseAdapter`, whose block parameter is the abstract `TableDefinition`;
   under `strictFunctionTypes` a narrower block is contravariantly rejected, so
   `migration.ts` casts through `Parameters<DatabaseAdapter["createTable"]>[2]`.

The root cause is that `Migration` has no static knowledge of which adapter it
will run against — the adapter is resolved at runtime from the config, so there
is nothing for `TableDefinitionOf<A>`
(`connection-adapters/abstract/schema-definitions.ts:1061-1065`) to resolve
against. PR #7024 solved the adapter-level half precisely because the adapter
_is_ the receiver there.

`changeTable` is the untouched sibling: it yields `Table` (the alter-table
proxy), a different type family with its own per-adapter subclasses, and carries
the same shortcoming.

## Converged shape

Let a migration's block resolve its adapter's column methods with neither a
caller annotation nor a cast at the forward — e.g. by parameterising `Migration`
(and `Schema.define`) on the adapter type it will run against, so
`TableDefinitionOf<A>` has a receiver, or by another mechanism that keeps the
Rails names and body shape intact. If no such mechanism exists, `pnpm tasks
block` this with the specific TS limitation — do not close it by rewriting the
JSDoc receipt.

## Acceptance criteria

- [ ] A PG migration block resolves `t.enum(...)` with no `(t: PgTableDefinition)`
      annotation and no cast, or the story is blocked with the TS limitation named.
- [ ] The contravariance casts at `migration.ts`'s `createTable` /
      `createJoinTable` forwards are gone.
- [ ] `changeTable`'s `Table` half is covered or split into its own story.
- [ ] `pnpm typecheck` clean; `parity:api` / `parity:api:extra` deltas
      non-negative.
