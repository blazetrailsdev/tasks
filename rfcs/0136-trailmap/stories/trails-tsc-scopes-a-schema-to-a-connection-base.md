---
title: "trails-tsc scopes each --schema to the abstract base that connects to it"
status: claimed
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-02T12:51:05Z"
assignee: "test-trailmap-through-a-test-helper-fixtures-and-app-routes"
blocked-by: null
closed-reason: null
---

trailmap has two model families on one table name: read-only Stats models (app/models/compare-stats.ts) and writers (app/models/stats-sync). Adding --schema db/statsSync_schema.ts to the build generates declares for the Stats subclasses too, giving TS2415/TS2611 on CompareRun. Expected: a schema applies only to models under the base class of its database, as Rails resolves columns per connection. Until then the 22 stats-sync models have no generated types and each warns.
