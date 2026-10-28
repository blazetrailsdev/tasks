---
title: "Port trailmap#82 (session files, JSON API idioms, shared fleet upstream, dep-held as blocked) to rails/"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trailmap#88
claim: "2026-10-28T12:04:01Z"
assignee: "port-pr-82-to-the-rails-twin"
blocked-by: null
closed-reason: null
---

trailmap#82 landed while `rails/` (#85) was in flight, so its changes exist only in the trails app. Port them to `rails/` so the two sites say the same thing again:

- `/sessions/file`, `/sessions/transcript`, `/sessions/pane`: paths validated before ringo is asked, size bounded, the transcript served with `Content-Security-Policy: sandbox`, the pane replayed through the same renderer.
- The JSON API: route defaults, `rescue_from` for 500s only, and a loopback-only `before_action` concern (private in Rails; record the trails difference in `rails/DEVIATIONS.md`).
- One shared upstream read of ringo's fleet stream for all viewers.
- Ready stories held by an unfinished dep shown as blocked ("Blocked on deps").

## Acceptance

- Each item answers identically on both sides for the same database and request (twin-diff and the page gates agree).
- Anything that cannot match is an entry in `rails/DEVIATIONS.md`.
