---
title: "trails-tsc does not treat ActiveJob classes as models"
status: in-progress
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9618
claim: "2026-11-02T12:51:05Z"
assignee: "test-trailmap-through-a-test-helper-fixtures-and-app-routes"
blocked-by: null
closed-reason: null
---

Build warns: ApplicationJob (app/jobs/application-job.ts) and StatsSyncJob read table application_jobs, in no --schema file. Jobs extend activejob Base, not ActiveRecord Base; the scan matches the name. Expected: no table inference for app/jobs.
