---
title: "converge-hash-config-configuration-alias"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7543
claim: "2026-09-05T23:06:51Z"
assignee: "converge-hash-config-configuration-alias"
blocked-by: null
closed-reason: null
---

## Context

`HashConfig` carries two readers over the same field: `configurationHash`,
which mirrors `attr_reader :configuration_hash`
(`vendor/rails/activerecord/lib/active_record/database_configurations/hash_config.rb:23`),
and `configuration`, a trails-only alias Rails has no counterpart for.

Surfaced in PR #7243, which moved the hash and its readers down from
`DatabaseConfig` to `HashConfig` (story
`database-config-holds-hash-config-configuration-hash`) and carried the alias
across rather than repointing its callers, to keep that PR to its story.

The alias is read at
`packages/activerecord/src/database-configurations.ts:132,139`,
`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:168`,
`packages/activerecord/src/tasks/mysql-database-tasks.ts:19,184`,
`packages/activerecord/src/tasks/postgresql-database-tasks.ts:35`, and in
several tests (`sqlite-rake.test.ts`, `sqlite-database-tasks.trails.test.ts`,
`migration.test.ts`), each of which Rails writes as `configuration_hash`.

## Acceptance criteria

- [ ] Every caller reads `configurationHash`, the name
      `hash_config.rb:23` gives the reader.
- [ ] The `configuration` getter and its `@noRailsEquivalent` receipt are
      deleted from `packages/activerecord/src/database-configurations/hash-config.ts`.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow; the
      `extra-surface-mark.json` activerecord marks are tightened by the drop.
- [ ] Green on all three lanes.
