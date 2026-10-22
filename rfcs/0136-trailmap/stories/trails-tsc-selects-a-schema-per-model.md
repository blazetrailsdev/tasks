---
title: "trails-tsc: per-model schema selection when two databases hold a same-named table"
status: blocked
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Its own AC: start only when an app has a table name in two of its databases. trailmap origin/main (5f1f58f): db/schema.ts and db/hub_schema.ts share no table name, so the trigger has not fired."
closed-reason: null
---

## Context

Since trails#8954, `trails-tsc` accepts `--schema` more than once and merges the files' tables into one flat record. A table that appears in two files is refused, because one name cannot be typed against two sets of columns. Two databases can legitimately each have a table with the same name. Rails picks a model's database through `connects_to` on its abstract base class (activerecord/lib/active_record/connection_handling.rb), so each model reads the columns of its own database.

## Acceptance criteria

- A schema file can be tied to an abstract base class, for example `--schema Hub=db/hub_schema.ts`. Models that descend from that class look up their table only in that file.
- A table name that appears in two files is accepted when each file is tied to a different base class. It is still refused when the files are not tied to a base class.
- Add tests in `cli.test.ts` and `virtualize.trails.test.ts`.
- Start this only when an app actually has a table name in two of its databases.
