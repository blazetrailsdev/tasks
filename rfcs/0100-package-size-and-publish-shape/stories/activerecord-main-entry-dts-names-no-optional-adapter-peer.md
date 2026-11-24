---
title: "activerecord-main-entry-dts-names-no-optional-adapter-peer"
status: draft
updated: 2026-11-24
rfc: "0100-package-size-and-publish-shape"
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

`@blazetrails/pg`, `@blazetrails/mysql2` and (since trails#10722) `@blazetrails/sqlite3` are
optional peers of `@blazetrails/activerecord`, as Rails' `activerecord.gemspec` names no
adapter gem. At run time the main entry loads none of them. The emitted `.d.ts` graph
of the main entry still names all three, so a consumer that does not install one and
compiles with `skipLibCheck: false` gets TS2307. Measured on 2026-11-24 with a consumer
`import { Base } from "@blazetrails/activerecord"` in a tree with none of the three
installed: 7 TS2307 for `@blazetrails/pg`, 2 for `@blazetrails/mysql2`, 4 for
`@blazetrails/sqlite3`.

Paths that reach the adapters:

- `packages/activerecord/lib/namespaces.ts:29`: `import type { SQLite3Adapter }`, and the
  `typeof import("./connection-adapters/sqlite3/*.js")` members at `:522-524` (the
  PostgreSQL / Mysql namespace members have the same shape)
- `packages/activerecord/lib/connection-adapters/pool-config.ts:118`: `engine?: import("@blazetrails/sqlite3").EngineOpenV2`
- the `.d.ts` files that import the gem ports: `connection-adapters/sqlite3-adapter.d.ts`,
  `sqlite3/database-statements.d.ts`, `postgresql-adapter.d.ts`,
  `postgresql/{database-statements,quoting,oid/array}.d.ts`, `mysql2-adapter.d.ts`,
  `mysql2/database-statements.d.ts`

## Acceptance criteria

- A consumer tree with none of `@blazetrails/pg`, `@blazetrails/mysql2` and
  `@blazetrails/sqlite3` installed typechecks `import { Base } from "@blazetrails/activerecord"`
  with `skipLibCheck: false`, with no TS2307 for an adapter gem port.
- Installing an adapter's port still types its namespace members (`ConnectionAdapters.SQLite3Adapter` etc.).
- A guard (a scripts test that builds such a consumer from `dist/`) keeps it that way.
