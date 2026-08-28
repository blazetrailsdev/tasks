---
title: "R4: drop the tableless synthesize-columnsHash-from-declarations fallback"
status: done
updated: 2026-08-28
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: 7143
claim: "2026-08-28T00:45:13Z"
assignee: "r4-drop-tableless-synthesize-from-declarations"
blocked-by: null
closed-reason: null
---

## Context

`r2-drop-synthesize-converge-adhoc-model-tests` (#3856) dropped the
synthesize-`columnsHash`-from-declarations fallback for **table-backed** models.
The **tableless** half survives, and #7076 (RFC 0115,
`retire-remaining-attribute-definitions-registry`) has just re-pointed it off the
retired `_attributeDefinitions` registry onto a replay of the pending-modification
queue — moving it, not removing it.

Rails has no counterpart at any of these sites. `columns_hash` is a DB read
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:592-594`), and
`_default_attributes` seeds from `columns_hash` alone
(`vendor/rails/activerecord/lib/active_record/attributes.rb:241-252`), so in Rails
a model with no table simply has no columns and every declaration arrives through
the pending replay
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:53-72`).

What #7076 left in `packages/activerecord/src/model-schema.ts`:

- `declaredAttributes` — `_default_attributes` seeded from an empty hash rather
  than `columns_hash`. It cannot call `_defaultAttributes()` itself, which
  re-enters `columnsHash()` on an unreflected class.
- `applyDeclarations` — a copy of `apply_pending_attribute_modifications`
  (`attribute_registration.rb:78-86`) restricted to `PendingType` / `PendingDefault`.
  The restriction is load-bearing, not cosmetic: replaying `PendingDecorator` over
  an unseeded set makes `enum`'s decorator raise on the `Type.default_value` such a
  set answers with (`packages/activerecord/src/enum.ts:164-168`).
- `synthesizedColumn` — a declared attribute dressed as a column
  (`name` / `type` / `default` / `limit`).
- `declaredAttributeNames` — exported, `@noRailsEquivalent CONVERGEABLE`, read only
  by `Base.ensureSchemaLoaded` (`packages/activerecord/src/base.ts`).

Four reader sites remain: the `columnsHash` fallback, the same synthesis in
`loadSchemaBangAnchor`, the `createTable` DDL helper, and
`reconcileVirtualAttributes`.

## Converged shape

No synthesis. A tableless attribute-only model answers an empty `columns_hash` and
gets its whole attribute set from the pending replay, exactly as ActiveModel does —
which deletes `declaredAttributes`, `applyDeclarations`, `synthesizedColumn` and
`declaredAttributeNames` together, and with them the only remaining need for a
decorator-free replay variant.

Two entanglements to sequence rather than discover:

- `reconcileVirtualAttributes` and `_virtualAttributes` are owned by RFC 0115
  `retire-virtual-attribute-reconciliation`; land that first or together, since the
  `virtual` flag exists only to keep non-columns out of this synthesis.
- `createTable` is a test-only DDL helper that builds a table FROM the declarations.
  It needs its own answer — most likely the canonical schema (RFC 0059) rather than
  a declaration-derived `CREATE TABLE`.

## Acceptance criteria

- [ ] `declaredAttributes`, `applyDeclarations`, `synthesizedColumn` and
      `declaredAttributeNames` are deleted from `model-schema.ts`.
- [ ] `columnsHash` and `loadSchemaBangAnchor` have no synthesized-from-declarations
      fallback; a tableless model answers `{}`.
- [ ] `Base.ensureSchemaLoaded`'s declaration-scan gate resolves without a
      declared-names read, or is removed with it.
- [ ] `pnpm parity:api:extra --package activerecord` drops the
      `declaredAttributeNames` `@noRailsEquivalent`; `parity:api:calls` / `:args`
      clean; parity deltas non-negative.
