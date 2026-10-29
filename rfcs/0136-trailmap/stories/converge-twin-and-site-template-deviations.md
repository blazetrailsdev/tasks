---
title: "Converge or record the template markup twin-diff finds between rails/ and app/"
status: in-progress
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#91
claim: "2026-10-28T22:52:30Z"
assignee: "check-the-transcript-page-under-its-csp-sandbox"
blocked-by: null
closed-reason: null
---

## Context

twin-diff's template pass (trailmap#84) reports markup that the Rails twin and the trails site render differently. Text that names the framework is already normalised away.

- `app/views/layouts/application.html.tse:22` has a "Sessions" nav link (`<a href="/sessions">`) that `rails/app/views/layouts/application.html.erb` lacks. The twin also has no sessions pages, and twin-diff reports `views/sessions/*` as TS-only.
- `app/views/home/index.html.tse:32-39` renders `shared/status-badge` six times, one per status, where `rails/app/views/home/index.html.erb:29` loops over the statuses.
- `app/views/home/index.html.tse:18` tells you to run `pnpm db:seed`, where the twin says `bin/rails db:seed`. Each names its own command; decide whether that is a deviation to record.
- `views/dashboard/index`: the twin loads `asset_path("dashboard.js")`, and the TS loads `javascript_path("dashboard")` (`index.html.tse:117`).

## Acceptance criteria

- The sessions pages are either ported to the twin or recorded as TS-only in `rails/DEVIATIONS.md`.
- The home page's status badges have one shape on both sides.
- Each remaining item is converged or recorded.
- Screenshots of every page changed, per CLAUDE.md.
