---
title: "Dashboard usage: a reset in the past reads as stale, not 100% elapsed"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 8
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

The live dashboard for trailmap#162 showed Codex's week as "100% of week elapsed (4d 20h under)", with the now marker pinned at the right edge. ringo's `/codex-usage-status` sent a `weeklyResetsAt` that had already passed, because Codex publishes limits only while a session runs (`webhook/codex_usage.go`). In trailmap, `hoursUntilReset` (`app/assets/javascripts/fleet-format.js`) clamps a past reset to 0 hours left, so `weekElapsedPercent` answers 100. `weekTicks` and the pace line then draw a stale window as if it were current. ringo's own `renderUsage` has the same arm.

## Acceptance criteria

- When a row's reset is in the past, the week row says the window is stale ("reset passed; waiting for a new reading") instead of drawing 100% elapsed, the now marker, ticks and an "under" pace.
- The test in `test/assets/fleet-format.test.js` covers a `weeklyResetsAt` before `now` for both Claude and Codex.
