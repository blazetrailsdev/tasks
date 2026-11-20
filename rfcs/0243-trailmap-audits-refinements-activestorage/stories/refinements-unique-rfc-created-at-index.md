---
title: "trailmap: unique (rfc_id, created_at) on refinements, rescue RecordNotUnique in POST /rfc-refines"
status: draft
updated: 2026-11-20
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`POST /rfc-refines` dedupes an imported report by `Refinement.findBy({ rfc_id, created_at })`, then inserts (trailmap `app/controllers/rfc-refines-controller.ts`, and the twin `rails/app/controllers/rfc_refines_controller.rb`, both since trailmap#183). The index `index_refinements_on_rfc_id_and_created_at` (`db/schema.ts:114`, `db/migrate/20261118000013_create_refinements.ts`) is not unique. So two concurrent posts of one `(rfc, when)` can both store it. `POST /audits` avoids the same race with a unique index plus a `RecordNotUnique` rescue (`app/controllers/audit-reports-controller.ts`). Today it is safe only because the import is sequential and an agent's report carries no `when`.

## Acceptance criteria

- [ ] A migration in both apps makes `(rfc_id, created_at)` unique on `refinements` (the twin's `rfc_refinements`).
- [ ] Both controllers rescue `RecordNotUnique` and answer 200 with the winner's id, as `AuditReportsController` does. The "check, then an insert" note in their docs is removed.
- [ ] Each app has a test for the rescue arm.
