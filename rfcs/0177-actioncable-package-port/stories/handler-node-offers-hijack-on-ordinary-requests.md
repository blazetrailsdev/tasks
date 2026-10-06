---
title: "rack: Handler::Node offers rack.hijack only on upgrade requests"
status: draft
updated: 2026-10-06
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["rack"]
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

Raised reviewing trailmap#39. Since trails#8566 `Handler::Node` offers `rack.hijack` only on the
path Node's `upgrade` event takes; an ordinary request gets `rack.hijack? = false`
(`packages/rack/src/handler/node.ts`, `service`). That was the scope of
`rack-handler-node-offers-rack-hijack-on-upgrade`, item 4.

Rack does not tie hijacking to an Upgrade header: full hijack is of "the raw HTTP/1 connection"
before headers are written (`vendor/rack/lib/rack/lint.rb:582-603`), and partial hijack exists for
"bi-directional streaming" on any response (`:606-636`). Node exposes the socket on an ordinary
request as `res.socket`.

The concrete want: a server-sent-event response that learns when the client has gone. On an
ordinary request the handler iterates the body and never notices a closed connection, so a
long-lived body leaks; trailmap is using a WebSocket upgrade for its relay only to get a socket it
can watch.

## Expected shape

`service` sets `rack.hijack?` true and offers full hijack (detach the socket from Node's response
before any head is written) and partial hijack (write the head, hand the stream to the header
callback, ignore the body), as `upgrade` does.

## Acceptance criteria

- [ ] An ordinary GET can full-hijack and write a raw HTTP/1 response itself; tested over a real listening handler.
- [ ] An ordinary GET answered with a `rack.hijack` response header gets its head from the handler and its body from the callback, and the callback sees the stream close when the client disconnects.
- [ ] Requests that do not hijack are byte-identical to today.
