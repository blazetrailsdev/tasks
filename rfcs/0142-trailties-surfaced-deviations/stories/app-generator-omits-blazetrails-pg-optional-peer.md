---
title: "trails new -d postgresql omits @blazetrails/pg, so the generated app cannot boot"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/package.json` now lists `@blazetrails/pg` as an
optional peer (`peerDependencies` + `peerDependenciesMeta.optional`). The
Postgres adapter imports it, at
`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`, among
other places. That makes it the counterpart of Rails' `gem "pg"`: the app
chooses its database driver and declares it.

`packages/trailties/lib/generators/database.ts:87` (`PostgreSQL#gem`) still
returns `["pg", "^8.19.0"]`, which is the npm driver only. A `trails new -d
postgresql` app therefore declares no `@blazetrails/pg`, and `bin/trails
server` exits on boot:

    LoadError: Error loading the 'postgresql' Active Record adapter. Missing a
    package it depends on? Cannot find package '@blazetrails/pg'

trailmap hit exactly this when it bumped trails to e3b832caf9 (trailmap#191),
and had to declare `@blazetrails/pg` itself. MySQL is presumably the same,
since `@blazetrails/mysql2` is also an optional peer.

## Acceptance criteria

- `PostgreSQL#gem` (and the MySQL equivalent) adds `@blazetrails/pg`
  (`@blazetrails/mysql2`) to the generated `package.json`, alongside or
  instead of the npm driver. Which one should follow what `@blazetrails/pg`
  itself depends on.
- A generator test asserts the dependency for `-d postgresql` and `-d mysql`.
- A freshly generated Postgres app boots: `bin/trails server` reaches
  "starting" without the LoadError.
