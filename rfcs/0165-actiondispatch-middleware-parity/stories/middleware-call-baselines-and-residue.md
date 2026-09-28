---
title: "Close RFC 0165 — middleware and log-subscriber call baselines to zero"
status: draft
updated: 2026-09-28
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "cookie-jar-and-flash-missing-members",
    "exceptions-debug-view-and-remote-ip-missing-members",
    "middleware-stack-callbacks-and-session-store-shapes",
    "port-small-middleware-test-remainders",
    "port-debug-exceptions-test-remainder",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the member stories, these rows remain under
`scripts/api-compare/call-mismatches-exclude/actiondispatch/middleware/`:
`ssl.json` (5), `public-exceptions.json` (3), `debug-exceptions.json` (2),
`host-authorization.json` (2), `show-exceptions.json` (2), `stack.json` (2), and
one each in `actionable-exceptions`, `debug-locks`, `exception-wrapper`,
`executor`, `remote-ip` and `request-id` — 22 rows — plus 2 in
`actiondispatch/log-subscriber.json`, both on `LogSubscriber#redirect`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/log_subscriber.rb:7-19`): an
omitted `env` call and a `round` argument shape (`event.duration.round`, `:15`).
No other RFC owns `log_subscriber.rb`.

## Acceptance criteria

- Each row is converged in the TS body and deleted by hand; marks are tightened.
  No reseed.
- A row that cannot converge carries a `PERMANENT` receipt only where CLAUDE.md
  already ratifies the shortcoming; anything else is filed first.
- Every Verification bullet in the RFC README holds.
