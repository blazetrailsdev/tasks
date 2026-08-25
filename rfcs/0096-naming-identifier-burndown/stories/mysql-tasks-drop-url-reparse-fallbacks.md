---
title: "MySQLDatabaseTasks reads configuration_hash only, dropping the trails URL re-parse"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6481
claim: "2026-08-13T17:35:42Z"
assignee: "mysql-tasks-drop-url-reparse-fallbacks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/tasks/mysql-database-tasks.ts` parses the config's
`url` itself (`parseDbUrl` / `urlParts`, `:24-40,:45,:54`) and `resolvedField`
(`:216-224`) falls back to those parsed parts for `host`, `port`, `username`,
`password` and `socket` when the key is absent from `configurationHash`.

Rails does none of that: `MySQLDatabaseTasks#prepare_command_options` reads
`configuration_hash` only
(`vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:76-93`),
because `DatabaseConfigurations::UrlConfig` has already merged the resolved URL
hash into `configuration_hash`
(`vendor/rails/activerecord/lib/active_record/database_configurations/url_config.rb:41-43`).

PR #6474 removed the same fallback for `database` — `requireDatabaseName()`,
which fell back to `urlParts.database` — after confirming `UrlConfig#database`
already resolves it. The remaining five fields are the same deviation, one
convergence away.

## Acceptance criteria

- [ ] `prepareCommandOptions` reads `configurationHash` only, as Rails does.
- [ ] `parseDbUrl`, the `UrlParts` type, the `urlParts` field and
      `resolvedField` are deleted — they have no Rails counterpart.
- [ ] Any gap that exposes (a URL config whose `configurationHash` lacks a
      resolved key) is fixed in `UrlConfig`/`ConnectionUrlResolver`, where Rails
      fixes it, not re-parsed in the tasks class.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow; no baseline
      row added.
