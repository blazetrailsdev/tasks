---
title: "/sessions/transcript relays ringo's whole page, chrome and nav included"
status: done
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trailmap#93
claim: "2026-10-29T13:52:37Z"
assignee: "port-the-session-transcript-page"
blocked-by: null
closed-reason: null
---

## Context

trailmap#82 serves `/sessions/transcript` by relaying ringo's `HandleTranscript` HTML verbatim (`SessionsController#transcript`). So the page is ringo's own document, with ringo's head, CSS and nav bar. Its nav links (`/tasks`, `/velocity`, `/cost`, `/crons`, `/logs`) point at paths trailmap does not serve. The transcript parser is `ParseTranscript` in btwhooks `webhook/transcript_page.go`, about 400 lines of Go outside `core`, so it cannot be run from `vendor/ringo/core.wasm` today.

## Acceptance criteria

- `/sessions/transcript` renders inside trailmap's layout, with the same stats, tool mix, time spent and turn cards ringo shows.
- Either `ParseTranscript` moves into ringo's `core` and is run from the WASM, or the port is held against ringo's output by a gate, as `gate:markdown` holds the markdown port.
- The page links only to routes trailmap serves.
