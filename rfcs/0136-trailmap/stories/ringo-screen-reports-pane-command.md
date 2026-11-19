---
title: "ringo's pane screen reports the pane's command, so End pane stops scraping"
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

End pane (`app/assets/javascripts/dashboard.js` `waitForShell`, `fleet-format.js`
`claudeHasExited`, trailmap#176) decides that Claude has quit by reading the screen:
a prompt suffix on the last line, and none of Claude Code's UI strings in the last
four lines. It reads the screen because ringo's `GET /pane/<n>/screen` body
(`exists, status, cwd, html, lines, hash`) carries no pane command. A change in
Claude Code's TUI wording would make it type `exit` into Claude.

## Acceptance criteria

- ringo's screen body adds `command` (tmux `#{pane_current_command}`), with a test in btwebooks.
- `claudeHasExited` uses `command` (anything but `claude`/`node`) when it is present,
  and keeps the screen reading only as a fallback.
