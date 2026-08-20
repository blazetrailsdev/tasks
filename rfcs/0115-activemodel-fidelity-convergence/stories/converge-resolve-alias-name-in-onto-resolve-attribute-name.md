---
title: "converge-resolve-alias-name-in-onto-resolve-attribute-name"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-20T21:53:51Z"
assignee: "converge-resolve-alias-name-in-onto-resolve-attribute-name"
blocked-by: null
closed-reason: null
---

## Context

`resolveAliasNameIn` (`packages/activemodel/src/attribute-methods.ts`) is the
last surviving extra alias-resolution spelling in activemodel. PR for
`converge-attribute-methods-copy-on-write-and-alias-helpers` deleted
`resolveAliasName` (folded into `resolveAttributeName`, the Rails name —
`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:396-398`,
`attribute_aliases.fetch(super, &:itself)`), but `resolveAliasNameIn` could not
follow: it takes a second `present` argument Rails' one-arg
`resolve_attribute_name` does not have, and applies a trails-only
camelCase-key bridge after consulting `present`.

Rails needs no such bridge because its alias keys and column names share one
naming convention. trails stores alias keys camelCase while derived names
(counter-cache columns, DB column names) are snake_case.

Call sites: `packages/activemodel/src/model.ts` (3),
`packages/activerecord/src/base.ts:4337`,
`packages/activerecord/src/readonly-attributes.ts:110`.

## Acceptance criteria

- `resolveAliasNameIn` is gone; every call site resolves through
  `resolveAttributeName` (attribute_methods.rb:396-398).
- The camelCase-key bridge is either removed (alias keys stored in the same
  convention as column names, as Rails has it) or moved to the one place that
  actually creates the mismatch, not applied on every read/write path.
- `pnpm parity:api:extra --package activemodel` shows `index.ts` down one novel
  row.
- Parity deltas non-negative for activemodel and activerecord.
