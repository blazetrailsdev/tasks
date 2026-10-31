---
title: "IrreversibleMigration is exported from activerecord"
status: draft
updated: 2026-10-31
rfc: "0196-solid-stack"
cluster: null
packages: ["activerecord"]
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

`IrreversibleMigration` exists in activerecord's migration module but is not exported from the package, so an application migration cannot raise it as Rails' `ActiveRecord::IrreversibleMigration` (migration.rb). Export it, then replace the plain `Error` in trailmap's `CreateStatsSyncTables#down`.
