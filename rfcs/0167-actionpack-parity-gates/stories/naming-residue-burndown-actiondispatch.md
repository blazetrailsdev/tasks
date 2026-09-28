---
title: "Burn actiondispatch's naming-class call-argument rows to zero"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  [
    "routing-parity-residue",
    "http-call-baselines-and-residue",
    "middleware-call-baselines-and-residue",
    "testing-harness-parity-residue",
    "screenshot-helper-test-describe-and-helper-call-rows",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls:args:report` showed 72 burndown-class naming rows in
actiondispatch on 2026-09-27, spread thin: `http/mime-type.ts` (5),
`http/content-security-policy.ts`, `middleware/public-exceptions.ts`,
`routing/inspector.ts`, `routing/url-for.ts` (4 each), `http/response.ts`,
`journey/formatter.ts`, `journey/path/pattern.ts`,
`middleware/exception-wrapper.ts`, `routing/mapper.ts`,
`routing/polymorphic-routes.ts`, `testing/assertions/routing.ts` (3 each), and
one or two in about twenty more files. Several are on files the subsystem RFCs
rewrite, so the count at claim time will differ; re-measure first.

## Acceptance criteria

- Every burndown-class naming row in actiondispatch is renamed to the Rails
  identifier or, where `classifyPair` files the pair permanent, receipted with
  `@missingRailsName … — PERMANENT`.
- `pnpm parity:api:calls:args:report` shows 0 burndown-class naming rows for
  actiondispatch. If that needs more than one PR, ship by directory and file the
  remainder as a story in this RFC.
