---
title: "Converge the routing call baseline rows"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
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

Seven call baseline rows sit on routing files, under
`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/`:

- `polymorphic-routes.json` — 4 (`routing/polymorphic_routes.rb`,
  `HelperMethodBuilder`)
- `redirection.json` — 2 (`routing/redirection.rb`, `Redirect` /
  `OptionRedirect` / `PathRedirect`)
- `url-for.json` — 1 (`routing/url_for.rb`)

Each records a trails body that omits a Rails call or passes it different
arguments.

## Acceptance criteria

- Each row is converged by making the TS body call what Rails calls, deleted by
  hand, and its mark tightened with `pnpm parity:api:calls:tighten`. No reseed.
- The three shards are empty; `pnpm parity:api:calls` and
  `pnpm parity:api:calls:args` are green.
