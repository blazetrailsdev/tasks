---
title: "The Rack Node handler sets a keep-alive timeout"
status: done
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10385
claim: "2026-11-19T22:26:42Z"
assignee: "load-defaults-8-1-arm"
blocked-by: null
closed-reason: null
---

## Context

`packages/rack/src/handler/node.ts:61` builds the server with `http.createServer` and sets no keep-alive timeout, so Node's 5 s default applies. Puma's `persistent_timeout` was set to 75 in the $12 Server Challenge submission that trails#9425 ports, and the challenge needs at least 65 s behind Nginx. Puma is not vendored, so the citation is the setting's name.

## Acceptance criteria

- The Rack Node handler accepts a keep-alive timeout option and applies it to `server.keepAliveTimeout`, with `headersTimeout` above it.
- A test shows an idle connection surviving past 5 s when the option is set.
