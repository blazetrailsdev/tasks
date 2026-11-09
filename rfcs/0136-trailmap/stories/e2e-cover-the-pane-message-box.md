---
title: "trailmap: e2e-cover the pane page's message box (send, refusal text, disabled on exit)"
status: claimed
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-11-09T20:55:16Z"
assignee: "e2e-cover-the-pane-message-box"
blocked-by: null
closed-reason: null
---

## Context

trailmap#132 added the message box to `/panes/<n>`. The relay
(`FleetController#message`, `rails/ FleetController#message`) is tested in
both apps, but the browser half in `app/assets/javascripts/pane.js`
(`sendMessage` and the `paneSend` submit handler) is not tested anywhere.
That half POSTs with `X-CSRF-Token` from the meta tag, clears the input on a
204, shows the relay's or ringo's text on failure, and disables the input
and button once `state.exited` is set. `dashboard-e2e` covers the fleet
page's controls this way, but not this page.

## Acceptance criteria

- An e2e test against a stand-in ringo: typing a line and pressing Enter
  posts `{"text": ...}` with the CSRF header and clears the box on a 204.
- A 410 from ringo puts its text in `#paneSendResult`.
- An exited pane (`{exists:false}`) disables `#paneMessage` and
  `#paneSendButton`.
