---
title: "trailmap: the broadcast box focuses on an empty message and disables both buttons in flight"
status: done
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trailmap#70
claim: "2026-10-15T18:45:11Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

trailmap#64 ported ringo's broadcast box and named two places it differs from
`sendBroadcast` (`webhook/dashboard.go:2117`):

- An empty message does nothing. ringo focuses the input, which is what tells
  the operator why nothing happened.
- Only the clicked button is disabled while a broadcast is in flight. ringo
  disables both, so a second audience cannot be sent the same sentence
  mid-flight.

Both are small, and both are in `app/assets/javascripts/`: `controlRequest`
returns `null` for an empty message, and the listener disables
`event.target`'s button only.

## Acceptance criteria

- [ ] Sending with an empty message focuses `#bcastMsg`.
- [ ] Both broadcast buttons are disabled for the duration of a send, and
      both come back.
- [ ] `scripts/dashboard-e2e.ts` covers both.
