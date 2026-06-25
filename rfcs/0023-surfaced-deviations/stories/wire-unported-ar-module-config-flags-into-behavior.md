---
title: "Wire unported AR module-config flags (timestampedMigrations, migrationStrategy, fixtures FK verify, YAML coder) into framework behavior"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4097 added faithful-default `ar-config.ts` bindings for four `ActiveRecord`
module-config flags that trails has NO current behavior for — the default is
present and Rails-correct, but nothing consults it. Each needs the framework
wired to actually honor it. These are independent features and should be SPLIT
into per-flag stories during triage:

- `timestampedMigrations` (default `true`, active_record.rb:387) — consulted by
  migration generators when choosing a timestamp vs sequential-number filename
  prefix. trails migration generation must read it.
- `migrationStrategy` (default `Migration::DefaultStrategy`, active_record.rb:401)
  — `Migrator`/migration execution should instantiate and run through the
  configured strategy class instead of calling `up`/`down` directly. trails has
  `migration/default-strategy.ts` and `execution-strategy.ts` but does not yet
  dispatch migrations through `arConfig.migrationStrategy`.
- `verifyForeignKeysForFixtures` (default `false`, active_record.rb:429) —
  fixture loading should run a post-load FK verification pass when true.
- `useYamlUnsafeLoad` / `yamlColumnPermittedClasses` (active_record.rb:439/454)
  — the YAML column coder should select unsafe-load vs safe-load and thread the
  permitted-classes list. (Pairs naturally; may be one story.)

Out of scope here but related un-consumed defaults from the same PR worth noting
during triage: `asyncQueryExecutor` (load_async pool selection), `databaseCli`
(dbconsole client), `raiseIntWiderThan64bit` (PG integer-width guard).

## Acceptance criteria

- Split into per-flag stories; each wires the framework consult site to honor
  the `ar-config.ts` binding, with Rails-named tests covering the behavior.
- Defaults already match Rails; behavior is added, not changed for the default
  path.
