---
title: "rack: an upgrade request's body is left on the socket, not in rack.input"
status: draft
updated: 2026-10-06
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["rack"]
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

Raised reviewing trailmap#39. `Handler::Node#upgrade` (`packages/rack/src/handler/node.ts`) sets
`rack.input` to an empty `StringIO` and pushes every byte of `head` back onto the socket, because a
WebSocket client's bytes after the handshake are frames for whoever hijacks. An upgrade request
that carries a body (a positive `Content-Length`) therefore has that body on the socket and nothing
in `rack.input`, even when the app declines to hijack and answers normally. Rack requires
`rack.input` to hold the request body (`vendor/rack/lib/rack/lint.rb:423-426`).

Rare in practice: browsers send no body with a WebSocket handshake.

## Expected shape

When the request declares a `Content-Length`, that many bytes (from `head`, then the socket) are
read into `rack.input` before the app runs, and only the remainder is left on the socket.

## Acceptance criteria

- [ ] An upgrade request with a 5-byte body followed by a frame: the app reads the 5 bytes from `rack.input`, and a hijacker reads the frame from the socket.
- [ ] An upgrade request with no body is unchanged.
