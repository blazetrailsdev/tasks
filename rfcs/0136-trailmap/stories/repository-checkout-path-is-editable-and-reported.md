---
title: "Set a repository's checkout path from its settings page, and say why the spawn picker is empty"
status: in-progress
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#150
claim: "2026-11-17T01:06:47Z"
assignee: "dashboard-e2e-covers-message-mode-footer"
blocked-by: null
closed-reason: null
---

## Context

Found while fixing trailmap#147. The dashboard's spawn picker (`#repo`) was empty
on production. `Repository.spawnChoices` (`app/models/repository.ts:188`) offers
hub rows that have a `checkout_path`, merged with `FLEET_REPO_PATHS`. On
2026-11-16 all four hub rows (trails, trailmap, tasks, ringo) had a NULL
`checkout_path`, and the dokku app had no `FLEET_REPO_PATHS`. The picker showed
nothing, and the page did not say why. The only fix was a hand-written
`UPDATE repositories SET checkout_path = ...` through `dokku postgres:connect`.
ringo's row is still NULL.

The page cannot tell "no repos configured" (`index.html.tse`, the
`repos.length === 0` option) apart from "repos exist, but none has a checkout".

## Acceptance criteria

- A repository's settings page (`repo-settings-controller.ts`) can set and clear
  `checkout_path`, in both apps.
- When the hub has repositories but none has a checkout, the spawn picker's
  empty option says so and links to where you set one.
- Both apps render the same empty-state text (the controller test and the Rails
  test assert it).
