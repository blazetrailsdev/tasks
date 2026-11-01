---
title: "Replace the hand-written schema_migrations stamp in the stats seed"
status: claimed
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: null
---

docs/deploy.md seeds stats-job.db and stamps schema_migrations by hand, or db prepare drops every table. A later migration makes the literal version easy to get wrong. Replace with a script that seeds, stamps from db/stats-sync-migrate and refuses an existing target.
