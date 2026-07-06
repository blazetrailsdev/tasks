---
title: "SchemaStatements defines a duplicate tableAliasLength; Rails only has it in DatabaseLimits"
status: ready
updated: 2026-07-03
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails' `connection-adapters/abstract/schema-statements.ts` (~line 1448)
defines a `protected tableAliasLength(): number { return 64; }`. This is a
trails invention: in Rails, `table_alias_length` lives ONLY in DatabaseLimits
(vendor/rails/.../connection*adapters/abstract/database_limits.rb:16, returning
`max_identifier_length`). Rails' SchemaStatements only \_uses* it
(`table_alias_for`, schema_statements.rb:28-29), it does not define it.

Surfaced during PR #4519: when `include()` flipped to last-included-wins, this
duplicate became a real mixin-vs-mixin collision on `AbstractAdapter`
(SchemaStatements included before DatabaseLimits). It is currently value-safe
because both return 64 and no adapter overrides `maxIdentifierLength`, but the
duplicate is a latent divergence — if an adapter ever overrides
`maxIdentifierLength`, the two definitions silently diverge and which one wins
depends on include order.

## Acceptance criteria

- [ ] Remove the `tableAliasLength` definition from
      `abstract/schema-statements.ts` so it lives only in DatabaseLimits,
      matching Rails.
- [ ] `tableAliasFor` continues to resolve `tableAliasLength` via the
      DatabaseLimits mixin.
- [ ] No behavior change on any adapter (all still resolve to 64 today).
