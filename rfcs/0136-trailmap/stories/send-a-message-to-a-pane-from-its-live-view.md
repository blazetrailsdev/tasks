---
title: "trailmap: send a message to a pane from its live view"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#45 shipped the live pane view (`/panes/<n>`) read-only, and named this as its follow-on: a
message box on that page, so a person watching an agent can answer it without SSH + tmux.

ringo owns tmux, so ringo does the sending; trailmap relays through its own origin and SSO, the way
`FleetController#control` relays the dashboard's buttons. This is a state-changing request to a
process that drives agents, so it goes through `FLEET_CONTROLS`' allowlist and the framework's
forgery protection like the other controls, and the pane id is checked with `isPaneId`.

Not in scope: an interactive terminal, raw keystrokes, or control sequences. A line of text and
Enter.

## Acceptance criteria

- The ringo endpoint it needs is specified here before any trailmap code is written (ringo is
  `deanmarano/btwebooks`; if it has no such endpoint, that is a prerequisite to file and build
  first).
- A POST relay on trailmap, CSRF-protected, pane id validated, message length capped, answered
  502/503/504 as `control` is.
- A message box on `/panes/<n>` that is disabled once the pane has exited and reports ringo's
  refusal text when there is one.
- Tests for the relay, as `test/controllers/fleet-controller.test.ts` has for `control`.
