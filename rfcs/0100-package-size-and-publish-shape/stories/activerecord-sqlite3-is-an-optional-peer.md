---
title: "activerecord: @blazetrails/sqlite3 is an optional peer, not a dependency"
status: in-progress
updated: 2026-11-24
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord", "sqlite3", "trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10722
claim: "2026-11-24T21:30:35Z"
assignee: "activerecord-sqlite3-is-an-optional-peer"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/package.json` lists `@blazetrails/sqlite3` under
`dependencies`, so every activerecord install pulls the sqlite3 gem port
even for a PostgreSQL- or MySQL-only app. Rails does not:
`vendor/rails/v8.0.5.2/activerecord/activerecord.gemspec` has no sqlite3
dependency; the app's Gemfile adds it, via the database generator
(`vendor/rails/v8.0.5.2/railties/lib/rails/generators/database.rb:251`,
`["sqlite3", [">= 2.1"]]`). trails already models `@blazetrails/pg` and
`@blazetrails/mysql2` as optional peers in the same package.json.

Runtime imports of `@blazetrails/sqlite3` in activerecord are confined to the
SQLite adapter (`lib/sqlite-adapter.ts`, `lib/connection-adapters/sqlite3-adapter.ts`,
`lib/connection-adapters/sqlite3/quoting.ts`,
`lib/connection-adapters/sqlite3/database-statements.ts`);
`lib/connection-adapters/pool-config.ts:118` is type-only. `packages/solid-queue/package.json`
also depends on it.

## Acceptance criteria

- `@blazetrails/sqlite3` moves from `dependencies` to an optional
  `peerDependencies` entry in activerecord (keep it as a devDependency for tests).
- No activerecord module outside the SQLite adapter path imports it at
  runtime; verify with a plain-node import of built `dist/` entry points
  (`@blazetrails/activerecord` main entry) in a tree without `@blazetrails/sqlite3`.
- The app generator / quickstart add `@blazetrails/sqlite3` to a generated
  app's dependencies when the database is sqlite3, as Rails' database
  generator adds the gem; pg/mysql apps do not get it.
- solid-queue's dependency is reviewed for the same treatment (match
  solid_queue.gemspec).
- Typecheck still passes for consumers that do not install it (type-only
  references stay `import type`).
