---
title: "ringo: resumable per-RFC discussion sessions with a 5-minute idle reaper"
status: draft
updated: 2026-11-19
rfc: "0000-ringo-changes"
cluster: rfc-sessions
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's RFC page wants a long-running discussion session per RFC
(`rfc-page-discussion-session-tab`). ringo
(`deanmarano/btwebooks`) owns tmux and spawning: `spawnRFCRefine`
(`webhook/rfcautorefine.go:147`) spawns one-shot refine/sunset agents through
`sl.spawn(SpawnTaskReq{...})`, and `/pane/<n>/send` (`main.go:323`,
`webhook.NewPaneScreens`) types into a live pane. Nothing resumes a Claude
session after its pane is gone, and nothing closes an idle pane.

## Acceptance criteria

- `POST /rfc-session/start {slug, sessionId}` spawns Claude with
  `--session-id <sessionId>` in a stable per-RFC tasks worktree
  (`rfc-session-<slug>`), with a discussion prompt naming the RFC, and answers
  `{pane}`. The caller supplies the UUID; ringo does not persist it beyond
  its in-memory pane map.
- `POST /rfc-session/send {slug, sessionId, text}`: when a pane is live for
  the session, sends `text` + Enter; when none is, respawns with
  `--resume <sessionId>` in the same worktree, waits for the input prompt,
  then sends. Answers `{pane, resumed: bool}`.
- An idle reaper closes a session pane after 5 minutes (configurable) with
  no dialog — no operator send and no change in the captured screen — by
  sending `/exit` and then `kill-pane` after a grace period. The worktree and
  the `~/.claude/projects/...` transcript are kept.
- `GET /rfc-session/status?slug=` answers `{state: live|parked|none, pane,
sessionId, lastDialogAt}`, and every start/park/resume emits an `/events`
  message carrying the slug.
- Go tests cover start, send-to-live, send-after-park (resume path), and the
  reaper firing and not firing under activity.
