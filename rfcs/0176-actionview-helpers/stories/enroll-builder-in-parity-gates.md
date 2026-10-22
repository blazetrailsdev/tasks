---
title: "Enroll builder in parity:api and parity:test"
status: draft
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Enroll the builder package in parity:api and parity:test

## Context

trails#9225 vendored builder 3.3.0 (`vendor/sources.ts`, `builder` entry) with
`compareApi: false` and `compareTests: false`, so `parity:api:extra`,
`parity:api:calls` and `parity:test` do not yet measure `packages/builder`.
The port has deviations that the gates would check:

- `xmlbase.ts`'s `protected _indent_` stands in for Ruby's `@indent`
  (`vendor/builder/v3.3.0/lib/builder/xmlbase.rb:28`).
- `<<` is ported as `append` (`xmlbase.rb:116`). It needs an
  `OPERATOR_SPELLING_BY_FQN` row in `scripts/api-compare/operator-order-spelling.ts`.
- The `@missingRailsCall` / `@inventedArm` receipts on `_escape`
  (`xmlbase.rb:134-146`) and `XChar.unicode` (`xchar.rb:106-129`).
- Blocks are plain trailing functions, not ruby-compat `block()`, by the
  repo owner's ruling of 2026-10-22. CLAUDE.md § "A private generator may stand
  in for a block" still says a splat-tail block is `block()`-marked. Add the
  builder exception there so reviews stop flagging it.

## Acceptance criteria

- `compareApi` and `compareTests` are true for builder, and the gates are green.
- Every remaining deviation carries a receipt or is converged.
- CLAUDE.md records the plain-function block ruling for builder.
