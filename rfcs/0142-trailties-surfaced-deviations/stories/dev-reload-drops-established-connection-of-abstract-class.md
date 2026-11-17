---
title: "trails server (development) reload leaves an establishConnection'd abstract class querying the primary"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In trailmap, under `bin/trails server` in development, every page that reads a `Hub` model returns 500 with `SQLite3::SQLException: no such table: rfc_refines` (or `owners`). The query goes to the primary SQLite connection, not to the Postgres connection that `Hub.establishConnection(hubDatabaseConfig())` set at boot (`config/initializers/hub-database.ts:57`, `:76`). The same build, booted with `TRAILS_ENV=production`, serves those pages from Postgres correctly. Seen 2026-11-17 while taking screenshots for trailmap#154.

Suspected but not verified: the development reloader replaces the `Hub` class (and its subclasses, such as `RfcRefine`) with a fresh class object, and the connection specification the initializer registered on the old object does not carry over, so the new class falls back to `ActiveRecord::Base`'s pool. In Rails, `establish_connection` in an initializer survives a reload, because the connection handler keys pools by `connection_specification_name` (the class name), not by the class object.

## Acceptance criteria

- Reproduce in a trails example app: an abstract class gets a second database through `establishConnection` in an initializer, and a request that runs after a code reload queries the second database.
- Fix in the package that owns the behaviour (the reloader in trailties, or connection resolution in activerecord), with a test there.
- trailmap's `/rfc/<id>` and `/dashboard` render under `bin/trails server` in development.
