---
title: "ringo's pane screen reports the pane's command, so End pane stops scraping"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
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

- [ ] ringo's screen body adds `command` (tmux `#{pane_current_command}`), with a test in btwebooks.
- [x] `claudeHasExited` uses `command` when it is present, and keeps the screen
      reading only as a fallback. Landed in trailmap#207, as a shell allowlist
      (bash, zsh, fish, sh, dash, ksh, tcsh, csh, nu, pwsh, xonsh; a login `-`
      prefix stripped) rather than "anything but `claude`/`node`": the native
      Claude Code binary reports its version (`2.1.3`) as the pane command. An
      unlisted shell fails safe — End pane's `waitForShell` times out and sends
      nothing.

What is left is the btwebooks half only: trailmap reads `command` as soon as
ringo sends it.
