---
title: "A local dashboard e2e run leaves public/assets behind, which fails pnpm test"
status: ready
updated: 2026-11-16
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

## Context

`scripts/dashboard-e2e.sh:18` runs `./scripts/build-assets.sh`, which writes a
digested build into `public/assets/` (git-ignored, `.gitignore:22`) and leaves
it there. With that directory present, `pnpm test` fails four controller
tests (home, dashboard, panes: "renders through the application layout",
"loads the client half as an external script") because the layout now links
`/assets/application-<digest>.css` and the tests match
`/stylesheets/application.css`. Nothing says why; removing `public/assets`
fixes it. Hit on trailmap#145 after one local e2e run.

## Acceptance criteria

- Running `scripts/dashboard-e2e.sh` and then `pnpm test` passes, with no
  manual cleanup: either the e2e script builds into a scratch directory or
  removes what it built in its exit trap, or the suite does not read
  `public/assets`.
- If a stale `public/assets` can still change what the suite renders, the
  failing assertion says so.
