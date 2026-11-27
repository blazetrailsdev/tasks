---
title: "ringo: the pane screen body carries the pane's command"
status: closed
updated: 2026-11-27
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
closed-reason: "duplicate of ringo-screen-reports-pane-command, which stays open for its ringo half (trailmap half in trailmap#209)"
---

## Context

trailmap's `claudeHasExited` (`app/assets/javascripts/fleet-format.js`) now
prefers a `command` field on ringo's `GET /pane/<n>/screen` body (anything but
`claude`/`node` means Claude has quit) and reads the screen only when it is
absent. ringo does not send it yet: the body is `exists, status, cwd, html,
lines, hash` (btwebooks). Split from ringo-screen-reports-pane-command, whose
trailmap half landed.

## Acceptance criteria

- ringo's screen body adds `command`, from tmux `#{pane_current_command}`, with a test in btwebooks.
- Deployed, End pane on a live pane decides from `command` (no screen scraping needed).
