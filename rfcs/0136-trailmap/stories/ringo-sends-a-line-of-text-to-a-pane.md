---
title: "ringo: POST /pane/<n>/send types one line of text and Enter into a pane"
status: draft
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`send-a-message-to-a-pane-from-its-live-view` is blocked because ringo
(deanmarano/btwebooks) has no endpoint that sends text to a pane. Today ringo
only reads a pane (`GET /pane/<n>/screen`, webhook/panescreen.go) and answers
parked questions (`/ask/answer`, webhook/askrelay.go:204), which only reaches
an agent that asked through the relay. The tmux send-keys code is in
webhook/handler.go.

## Acceptance criteria

- `POST /pane/<n>/send` with JSON `{"text": "..."}`. The id is digits only,
  matching `paneScreenID`'s rule.
- Sends the text literally (`send-keys -l`), then Enter. No control
  sequences, no raw keys.
- Caps the length and refuses an empty message with 400.
- Answers 204 on success. A gone pane gets a 404 or 410 with a plain-text
  refusal that trailmap can show unchanged.
- Go tests cover the success path and each refusal.
- Found on trailmap#77.
