---
title: "Relocate adapter members whose PERMANENT receipt is false (they score moved)"
status: draft
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit (receipt A/B: every `@noRailsEquivalent`
stripped from `ts-api.json`, report re-scored). Each name below scores `moved`,
not `novel`, once its receipt is removed: Rails defines it, in a different
`.rb`. A `PERMANENT` "no Rails equivalent" claim on it is false, and `total`
stays gated, so this is relocation debt.

| trails                                                                           | Rails definition                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `connection-adapters/abstract-mysql-adapter.ts:215` `fullVersion`                | `connection_adapters/mysql2_adapter.rb:164`, `trilogy_adapter.rb`                                |
| `connection-adapters/abstract-mysql-adapter.ts:1310` `getFullVersion`            | `connection_adapters/mysql2_adapter.rb:168`, `trilogy_adapter.rb`                                |
| `connection-adapters/abstract-mysql-adapter.ts:157` `isTextType`                 | `connection_adapters/mysql2_adapter.rb:140`, `trilogy_adapter.rb`                                |
| `connection-adapters/postgresql/schema-definitions.ts:289` `defineColumnMethods` | `connection_adapters/abstract/schema_definitions.rb:332` (`ColumnMethods.define_column_methods`) |
| `connection-adapters/mysql/schema-definitions.ts:264` `defineColumnMethods`      | same                                                                                             |
| `connection-adapters/sqlite3-adapter.ts:360` `typeCastedBinds`                   | `connection_adapters/abstract/quoting.rb` (`type_casted_binds`)                                  |
| `connection-adapters/sqlite3-adapter.ts:1546` `extendedTypeMap`                  | `connection_adapters/abstract_adapter.rb:877`                                                    |
| `connection-adapters/abstract-adapter.ts:1213` `sqlKey`                          | `connection_adapters/postgresql_adapter.rb:914`                                                  |
| `connection-adapters/abstract/connection-pool.ts:230` `connectionHandler`        | `core.rb:768`                                                                                    |
| `connection-adapters/mysql/column.ts:30` `encodeWith`                            | `connection_adapters/column.rb` (`encode_with`)                                                  |

Prior art: `mysql-full-version-belongs-on-mysql2-adapter` (RFC 0051) is `done`,
yet `fullVersion`/`getFullVersion` still sit on the abstract MySQL adapter
behind a PERMANENT receipt.

## Acceptance criteria

- Each name above moves to the TS file mirroring the Rails `.rb` that defines
  it (or, where the trails override duplicates an inherited Rails body,
  is deleted in favour of the inherited one).
- Its `@noRailsEquivalent PERMANENT` receipt is deleted, not reworded.
- `pnpm parity:api:extra:gate` stays green with activerecord rowless.
