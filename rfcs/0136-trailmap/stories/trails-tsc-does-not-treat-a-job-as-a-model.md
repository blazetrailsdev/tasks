---
title: "trails-tsc does not treat ActiveJob classes as models"
status: draft
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Build warns: ApplicationJob (app/jobs/application-job.ts) and StatsSyncJob read table application_jobs, in no --schema file. Jobs extend activejob Base, not ActiveRecord Base; the scan matches the name. Expected: no table inference for app/jobs.
