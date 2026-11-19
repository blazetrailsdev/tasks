---
title: "ringo: audit the callers of the bare /spawn, then retire it or route it through the start script"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#178 deployed btwhooks `spawn-options`, so the dashboard's spawn dialog now goes through `spawnloop/dashboard-spawn`, which uses the start script, `--model` and a named worktree. ringo's bare `/spawn` (`HandleSpawnTask`, btwebooks `webhook/handler.go:3953`) still exists. It is mounted on the public mux (`main.go:342`) and the internal mux (`main.go:586`). With no start script given, it runs `NewWindowWithClaude`, which creates a bare `.claude/worktrees` checkout and passes no `--model`. Nothing in trailmap posts to it any more. #178 kept it because its internal callers were never audited.

trailmap#178 also never ran a real dialog spawn with Model=sonnet and Worktree=foo. Only `webhook/dashboardspawn_test.go` covers that path.

## Acceptance criteria

- List every caller of `/spawn` on both muxes (scripts, skills, crons, the spawn loop).
- Either remove the route, or make the no-start-script path go through the start script with the loop's `spawn_model`.
- Run one live spawn from the trailmap dialog with Model and Worktree set, and confirm `claude --model <m>` starts in a worktree named `<name>-<suffix>`.
