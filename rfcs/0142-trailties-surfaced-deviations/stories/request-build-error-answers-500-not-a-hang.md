---
title: "An error raised building the request answers 500, not a hang"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found on trails#9425: a missing `secret_key_base` raised while building the request left the HTTP request hanging instead of answering 500. `packages/rack/src/handler/node.ts:61-62` catches a rejected `handler.service`; reproduce first, since the failing path may be before or outside that promise. Rails answers such an error through `ActionDispatch::ShowExceptions` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb`) or the server's own 500.

## Acceptance criteria

- With `secret_key_base` unset, a request gets a 500 and the connection closes or completes.
- A regression test fails on the old code.
