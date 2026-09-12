---
title: "converge-pg-type-map-init-onto-adapter-class-methods"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`receipt-moved-adapter-subtrees-and-oid-types` receipted the six exported functions of
`packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts` as
`@noRailsEquivalent CONVERGEABLE converge-pg-type-map-init-onto-adapter-class-methods`.
The file has no Rails counterpart; each name is Rails surface living in another `.rb`:

| TS name (type-map-init.ts)   | Rails home                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `initializeTypeMap`          | `connection_adapters/postgresql_adapter.rb` `class << self; def initialize_type_map(m)`        |
| `registerClassWithLimit`     | `connection_adapters/abstract_adapter.rb` private class method `register_class_with_limit`     |
| `registerClassWithPrecision` | `connection_adapters/abstract_adapter.rb` private class method `register_class_with_precision` |
| `extractLimit`               | `connection_adapters/abstract_adapter.rb` `extract_limit`                                      |
| `extractPrecision`           | `connection_adapters/abstract_adapter.rb` `extract_precision`                                  |
| `extractScale`               | `connection_adapters/abstract_adapter.rb` `extract_scale`                                      |

`AbstractAdapter` already ports the four helpers as statics
(`abstract-adapter.ts` `registerClassWithLimit` / `registerClassWithPrecision` /
`extractLimit` / `extractPrecision` / `extractScale`), but typed over `TypeMap` with
`string | RegExp` keys; the PG copies take a `HashLookupTypeMap` and differ in the
precision/scale regexps. `PostgreSQLAdapter.initializeTypeMap` (static) delegates to the
free function.

## Acceptance criteria

- `PostgreSQLAdapter.initializeTypeMap` holds the body of `postgresql_adapter.rb`'s
  `initialize_type_map`, calling the inherited `AbstractAdapter` statics
  (`this.registerClassWithLimit(m, ...)`), widened to accept a `HashLookupTypeMap`.
- The PG-only `extract*` / `registerClassWith*` copies are deleted; the regexps match
  `abstract_adapter.rb`'s.
- The module-load `ArType.register(..., { adapter: "postgresql" })` calls stay loadable
  without a TDZ (verify with a plain-node import of the built modules).
- Every receipt citing this story is gone; `parity:api:extra --package activerecord` shows
  none of the six names; `total` tightened. PG lane green.
