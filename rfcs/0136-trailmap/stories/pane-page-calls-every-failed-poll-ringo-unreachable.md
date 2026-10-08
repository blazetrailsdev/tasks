---
title: 'trailmap: the pane page calls every failed poll "ringo is unreachable", including tmux-down and no-such-endpoint'
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The live pane page (trailmap#45, `/panes/<n>`) reports every failed poll with one sentence:
"ringo is unreachable — retrying. (reason)" (`noticeText` in
`app/assets/javascripts/pane-format.js`). That is right for the relay's 502 and 504, and wrong for
the rest:

- ringo answers 503 when tmux itself is down. ringo was reached; tmux was not.
- A ringo without the endpoint answers a bare 404. Seen for real before ringo shipped it: the page
  said "ringo is unreachable — retrying. (404 page not found)".
- The relay's own 503 (`RINGO_BASE is not set`) and 400s are configuration or caller errors, and
  retrying every 2s will never fix them.

## Acceptance criteria

- `fetchScreen` in `pane.js` passes the HTTP status through, and `screenStep` / `noticeText`
  distinguish at least: ringo unreachable or slow (502/504), ringo reached but cannot read the pane
  (503 from ringo), and ringo has no such endpoint or the request is refused (404/400).
- Each has its own sentence, tested in `test/assets/pane-format.test.js`.
- The screen is still never blanked, and a transient failure still retries.
