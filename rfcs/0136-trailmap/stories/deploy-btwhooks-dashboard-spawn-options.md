---
title: "trailmap: deploy btwhooks spawn-options so the spawn dialog's Model and Worktree take effect"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#178
claim: "2026-11-19T15:46:21Z"
assignee: "deploy-btwhooks-dashboard-spawn-options"
blocked-by: null
closed-reason: null
---

## Context

trailmap#168 moved spawn into its own dialog. The dialog posts `model` and `name` to
`spawnloop/dashboard-spawn` (app/assets/javascripts/fleet-format.js, `case "spawn"`).
Deployed ringo's `HandleDashboardSpawn` decodes only `{repoDir, message}`, so it ignores both
fields. The change that reads them is on the local btwhooks branch `spawn-options`,
commit `bf9875b`, in ~/github/deanmarano/btwebooks/.claude/worktrees/spawn-options:
webhook/spawnloop.go:3562 for the name and the `dashboardModelPattern` check for the model.
Its tests are in webhook/dashboardspawn_test.go. #168 merged with that change still undeployed.

Separately, ringo's public `/spawn` (`HandleSpawnTask`, webhook/handler.go) still runs
`NewWindowWithClaude` when no start script is given. That creates a bare `.claude/worktrees`
checkout and passes no `--model`. Nothing in trailmap posts to it any more.

## Acceptance criteria

- btwhooks `spawn-options` is merged to its main and deployed to the ringo dokku app.
- A spawn from the trailmap dialog with Model=sonnet and Worktree=foo starts
  `claude --model sonnet` in a worktree named `foo-<suffix>`.
- Leaving both fields empty still spawns with the loop's `spawn_model` and a name taken from
  the first line.
- Decide whether ringo's bare `/spawn` should be removed or routed through the start script.
