---
title: "The pane page sends Enter and arrow keypresses, not only a line of text"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trailmap#178
claim: "2026-11-19T15:46:21Z"
assignee: "deploy-btwhooks-dashboard-spawn-options"
blocked-by: null
closed-reason: null
---

## Context

The pane page (`app/views/panes/show.html.tse`, `app/assets/javascripts/pane.js`)
can only type one line of text and press Enter. A person answering a TUI prompt in
the pane (a menu, a y/n picker, a permission dialog) needs to send a bare Enter
and the arrow keys. The user asked for this on trailmap#167; it was left out
because ringo cannot do it yet.

Today the path is `FleetController#message` (`app/controllers/fleet-controller.ts:145`)
-> ringo `POST /pane/<n>/send {"text"}` (btwebooks `webhook/panesend.go:23`), which
sends literally (`send-keys -l`) and refuses any control character
(`paneSendProblem`, `panesend.go:64-73`). So there is no way to send a key.

## Shape

- ringo: `POST /pane/<n>/keys {"keys": ["Enter","Up","Down","Left","Right","Escape","Tab"]}`,
  an allowlist of tmux key names passed to `tmux send-keys` without `-l`; 400 on
  anything else, 410 on an exited pane as `/send` does.
- trailmap: `POST /fleet/pane/:id/keys` relayed like `message` (same pane-id check,
  same timeout), with a validator next to `paneMessageProblem` in `config/fleet.ts`.
- Pane page: key buttons beside Send (Enter, arrow keys, Esc), and arrow keys
  forwarded when the screen `<pre>` has focus.

## Acceptance criteria

- [ ] ringo serves `/pane/<n>/keys` with the allowlist and tests.
- [ ] trailmap relays it; controller test covers a refused key and a good one.
- [ ] The pane page's key buttons send their key; e2e or DOM test covers one.
