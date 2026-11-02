---
title: "Stop the stats sync's changes column raising DangerousAttributeError"
status: done
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#108
claim: "2026-11-02T17:36:26Z"
assignee: "bin-jobs-forwards-its-arguments"
blocked-by: null
closed-reason: null
---

trails#9574 makes `changes` a dangerous attribute name, as in Rails, so define_attribute_methods raises for a schema column of that name. db/statsSync_schema.ts has `t.integer("changes")`, so a StatsSync model on that table raises after the next vendor bump. Rename the column in a stats-sync migration, or use `ignored_columns`, in the same PR as the bump, and carry it through scripts/seed-stats-job-db.sh's precondition.
