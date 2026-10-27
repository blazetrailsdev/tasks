---
title: "trailmap: suggested and draft pane dots on the fleet page"
status: done
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#80
claim: "2026-10-27T01:18:05Z"
assignee: "fleet-page-suggested-and-draft-pane-dots"
blocked-by: null
closed-reason: null
---

## Context

ringo (btwhooks `3532fc5`) now reports two more pane states that used to show up as plain `idle`:

- `suggested`: the pane is idle, and Claude Code's own suggestion for the next message is sitting in the input box (shown dimmed on screen).
- `draft`: the pane is idle, and the input box holds text the operator typed but didn't send.

These come through the `/events` envelope that `lib/fleet-relay.ts` already relays over the websocket, along with the input-box text:

- spawns and reviewers: `pane_status` plus `pane_input`
- PRs: `paneStatus` plus `paneInput`

`pane_input` / `paneInput` is left out when it is empty. Classifier: `parseInputBox` in `tmux/sender.go`. Rendering: `paneDot` in `webhook/dashboard.go`.

The fleet page's `PANE_DOTS` in `app/assets/javascripts/fleet-format.js` doesn't know these states, so both fall back to the muted `○ idle` ring.

## Acceptance criteria

- [ ] `paneDot` draws `suggested` as a muted filled ● titled `suggested: <text>`, and `draft` as a blue ● titled `draft: <text>`, using the shell's colour tokens.
- [ ] The text is HTML-escaped in the `title` attribute.
- [ ] `paneLine` takes the input text, and every caller passes it on: reviewer `entry.pane_input`, PR `pr.paneInput`, spawn `s.pane_input`.
- [ ] Unit tests cover both new states, the escaping, and the idle fallback when there is no text.
