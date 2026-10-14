---
title: "Converge the receiver-unread rows parity:api:key-reads lists"
status: draft
updated: 2026-10-14
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#8905, `pnpm parity:api:key-reads` (`scripts/api-compare/report-key-reads.ts`)
joins each pair by owner and lists 108 `receiver-unread` rows by default: Rails
reads a literal Symbol key off a named receiver and the port reads nothing off
a receiver of that name. Spot checks show these are mostly locals renamed away
from the Rails name, e.g.
`activerecord/connection-adapters/sqlite3-adapter.ts#addTimestamps` copies
`options` into `opts` where `connection_adapters/sqlite3_adapter.rb#add_timestamps`
reads `options[:null]` directly. trails#8905 fixed rack `setCookieHeader`
(`opts` → `value`, `rack/utils.rb:294-318`) and actionview `render`
(`hash` → `options`, `rendering_helper.rb:143`) the same way.

Rows per TS pair at merge (count, pair):

          7 activerecord/tasks/postgresql-database-tasks.ts#psqlEnv
          7 actionview/template/resolver.ts#parse
          6 actionview/helpers/number-helper.ts#escapeUnsafeOptions
          4 globalid/uri/gid.ts#build
          4 activerecord/connection-adapters/postgresql/schema-creation.ts#addColumnOptionsBang
          4 activerecord/connection-adapters/abstract/schema-statements.ts#typeToSql
          3 activerecord/connection-adapters/sqlite3/schema-creation.ts#addColumnOptionsBang
          3 actionview/template/handlers/tse.ts#translateLocation
          3 actiondispatch/middleware/ssl.ts#buildHstsHeader
          2 thor/actions.ts#[initialize]
          2 pg/connection.ts#conndefaultsHash
          2 activesupport/cache.ts#validateOptions
          2 activesupport/cache.ts#serializeEntry
          2 activesupport/cache.ts#retrievePoolOptions
          2 activesupport/cache.ts#namespaceKey
          2 activesupport/cache.ts#fetchMulti
          2 activerecord/migration/command-recorder.ts#invertChangeTableComment
          2 activerecord/migration/command-recorder.ts#invertChangeColumnDefault
          2 activerecord/migration/command-recorder.ts#invertChangeColumnComment
          2 activerecord/connection-adapters/sqlite3-adapter.ts#configureConnection
          2 actiondispatch/middleware/ssl.ts#httpsLocationFor
          1 trailties/generators/resource-helpers.ts#[initialize]
          1 trailties/generators/rails/db/system/change/change-generator.ts#database
          1 trailties/generators/rails/db/system/change/change-generator.ts#constructor
          1 trailties/generators/rails/controller/controller-generator.ts#addRoutes
          1 trailties/generators/model-helpers.ts#[initialize]
          1 trailties/generators/app-base.ts#keeps
          1 trailties/generators/actions.ts#generate
          1 thor/shell.ts#[initialize]
          1 thor/invocation.ts#[initialize]
          1 pg/connection.ts#reset
          1 activesupport/messages/rotation-coordinator.ts#normalizeOptions
          1 activesupport/cache.ts#saveBlockResultToCache
          1 activesupport/cache.ts#normalizeVersion
          1 activesupport/cache.ts#mergedOptions
          1 activesupport/cache.ts#keyMatcher
          1 activesupport/cache.ts#_instrument
          1 activesupport/cache.ts#handleExpiredEntry
          1 activesupport/cache.ts#fetch
          1 activesupport/cache.ts#constructor

## Acceptance criteria

- [ ] Each row is read against its Rails body. Where the port renamed the
      receiver, it is converged to the Rails local or parameter name and reads
      the key at Rails' position.
- [ ] Where the port is faithful and the report cannot pair it, the pairing
      rule is added to `report-key-reads.ts` with a test.
- [ ] `pnpm parity:api:key-reads` lists no `receiver-unread` row that is not
      explained in the PR body; split into per-package PRs if over the ceiling.
