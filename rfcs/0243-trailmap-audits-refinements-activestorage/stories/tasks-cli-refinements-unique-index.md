---
title: "tasks-cli-refinements-unique-index"
status: draft
updated: 2026-11-20
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: null
packages: []
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

## Context

trailmap#184 makes `(rfc_id, created_at)` unique on `refinements` in trailmap's `db/migrate/20261120000014_make_refinements_rfc_id_and_created_at_unique.ts`. The live database is migrated by the tasks CLI's own `db/migrate/20261118000013_create_refinements.ts` (tasks repo), whose index is still non-unique. Until the CLI has the matching migration, `POST /rfc-refines`' `RecordNotUnique` rescue never fires in production.

## Acceptance criteria

- [ ] The tasks repo has a migration with the same version and body as trailmap's `20261120000014`, which replaces the index with a unique one.
- [ ] The tasks repo's schema dump shows the index as unique.
