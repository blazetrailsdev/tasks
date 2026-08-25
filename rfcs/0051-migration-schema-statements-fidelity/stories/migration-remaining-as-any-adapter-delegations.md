---
title: "migration-remaining-as-any-adapter-delegations"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5774
claim: "2026-08-01T00:10:40Z"
assignee: "migration-remaining-as-any-adapter-delegations"
blocked-by: null
closed-reason: null
---

## Context

`Migration` reaches PostgreSQL-only schema statements through `this.connection`,
which is typed as the abstract adapter, and launders every such call through
`as any`. The constraint-validation cluster
(`validateForeignKey` / `validateCheckConstraint`) was converged by the
`migration-validate-foreign-key-delegates-through-any` story: those two now
narrow to a `ValidateConstraintStatements` interface
(`connection-adapters/abstract/schema-statements.ts`) that
`PostgreSQLAdapter` declares in its `implements` clause.

The remaining delegations in `packages/activerecord/src/migration.ts` still use
`as any`:

- `changeColumnComment` (~line 803), `changeTableComment` (~816)
- `enableExtension` (~824), `disableExtension` (~832)
- `createEnum` (~844), `dropEnum` (~866), `renameEnumValue` (~874)
- `addUniqueConstraint` (~887), `removeUniqueConstraint` (~908)
- the `DefaultStrategy`/replay paths near lines 1822-1909
  (`createSchema`, `createVirtualTable`, comment statements)

They were left out of that story because their migration-level option types are
`Record<string, unknown>` while the PG adapter declares real shapes
(`UniqueConstraintOptions`, `{ ifExists?: boolean }`,
`{ force?: "cascade"; schema?: string }`, `{ from, to }` comment hashes) — so
converging them is a genuine option-type reconciliation, not a mechanical cast
removal.

Rails forwards these via `Migration#method_missing`
(`vendor/rails/activerecord/lib/active_record/migration.rb:960-976`), untyped in
Ruby, so there is no fidelity argument for the cast.

Note a TypeScript limit found while doing the first story: `implements` compares
class methods bivariantly, so a _narrowed_ parameter on the adapter is not
caught by the interface alone — it only surfaces at call sites that pass an
object literal (excess-property check). Keep/extend such call sites in tests.

## Acceptance criteria

- [ ] The delegations listed above no longer use `as any`; each resolves against
      a real type (extend the adapter-specific interface, or a PG downcast).
- [ ] Migration-level option types are reconciled with the PG adapter shapes
      rather than widened back to `Record<string, unknown>` on the adapter side.
- [ ] `pnpm typecheck` clean; `migration.test.ts`, the enum/extension/comment
      and unique-constraint tests green on all three adapters.
