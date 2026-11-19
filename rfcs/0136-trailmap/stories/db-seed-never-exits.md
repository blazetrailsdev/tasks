---
title: "db-seed-never-exits"
status: ready
updated: 2026-11-19
rfc: "0136-trailmap"
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

`pnpm db:seed` (trailmap `db/seeds.ts`, `bin/trails db:seed`) writes its rows and prints, then never exits. Reproduced 2026-11-18 on main 85dab54 against a migrated dev hub: `timeout 90 pnpm db:seed` exits 124. Most likely an open Hub (Postgres) pool keeping the event loop alive after the seed task. db/seeds.ts says re-adding `Hub.removeConnection()` there is a regression, so the cause is probably in trails' `db:seed` task, which does not clear connections the way `db:migrate` does.

## Acceptance criteria

- Find whether trails' `db:seed` leaves connections open; fix it in trails with a test there.
- `pnpm db:seed` against the dev hub exits 0 after printing.
- Drop the "never exits" note from README's screenshot section.
