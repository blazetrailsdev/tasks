---
title: "Replace PERMANENT-receipted resolver registries with imports or listed slots"
status: done
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: 5
pr: trails#7990
claim: "2026-09-22T23:02:21Z"
assignee: "converge-resolver-registry-permanent-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. activerecord carries a family of
`set*Resolver` / `register*` / `global*` registries, each receipted
`@noRailsEquivalent PERMANENT`, that stand in for a Rails constant read. None is
one of the sixteen zero-import slots CLAUDE.md § Call-time constant resolution
lists, and that section is explicit that it is "the one sanctioned shape" and
that a slot read carries no guard. Several of these throw an invented
"not registered — import X first" error, which that section forbids.

| trails                                                                                                                                                                                      | Rails reads                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `log-subscriber.ts:48` `setBaseResolver`, `:56` `getBase`; `index.ts` `setLogSubscriberBaseResolver`                                                                                        | `ActiveRecord::Base` in `log_subscriber.rb`                                         |
| `connection-adapters/abstract/connection-pool.ts:222` `setConnectionHandlerResolver`                                                                                                        | `ActiveRecord::Base.connection_handler` (`core.rb:768`)                             |
| `connection-adapters/sql-type-metadata.ts:98` `registerTypeMetadataClass`                                                                                                                   | constant in `sql_type_metadata.rb`                                                  |
| `connection-adapters/abstract/table-name-options.ts:13-45` `registerTableNameOptions`, `globalTableNamePrefix`, `globalTableNameSuffix`, `globalPluralizeTableNames`, `globalGetPrimaryKey` | `Base.table_name_prefix` etc.; `Base.get_primary_key` (`schema_definitions.rb:397`) |
| `migration/ar-config-source.ts:17,25` `registerMigrationArConfig`, `migrationArConfig`                                                                                                      | `ActiveRecord::Base` / `ActiveRecord` module reads in `migration.rb`                |
| `token-for.ts:12` `registerGeneratedTokenVerifierSink`, `:91` `withFetch`                                                                                                                   | `token_for.rb`                                                                      |
| `load-schema-overrides-slot.ts:5,11` `loadSchemaOverrides`, `registerLoadSchemaOverride` (file-level tag)                                                                                   | none                                                                                |
| `database-configurations/database-config.ts:53` `adapterClass` (`@missingRailsCall resolve — PERMANENT`, throws when unregistered)                                                          | `database_config.rb:17`                                                             |
| `connection-adapters/abstract/schema-definitions.ts:807` `setPrimaryKey` (`@missingRailsCall get_primary_key — PERMANENT`)                                                                  | `schema_definitions.rb:397` `Base.get_primary_key`                                  |

## Acceptance criteria

- Each registry is replaced by a plain import where no cycle exists, or by a
  zero-import slot in the sanctioned shape (mutable binding + `_setX()`, no
  guard) that is added to the CLAUDE.md list where one does.
- The invented "not registered" throws are removed.
- All receipts above are deleted; none is reworded or relabelled PERMANENT.
