---
title: "IrreversibleMigration is exported from activerecord"
status: done
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 15
pr: trails#10150
claim: "2026-11-15T22:21:36Z"
assignee: "solid-cache-size-tests-need-seeded-srand"
blocked-by: null
closed-reason: null
---

`IrreversibleMigration` exists in activerecord's migration module but is not exported from the package, so an application migration cannot raise it as Rails' `ActiveRecord::IrreversibleMigration` (migration.rb). Export it, then replace the plain `Error` in trailmap's `CreateStatsSyncTables#down`.
