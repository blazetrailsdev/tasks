---
title: "Namespace member bodies are invisible to the call gates"
status: draft
updated: 2026-10-05
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
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

`extractNamespace` in `scripts/api-compare/extract-ts-api.ts` records a
namespace member with `name`, `visibility`, `params`, `line` and `file` only.
It never calls `extractCalls`, so the member has no `calls`, `callSeq`,
`callArgs` or `skeleton`. `harvestObjectLiteralMethods` in the same file records
all four for an object-literal member.

So a ported method written as an exported function inside an `export namespace`
is scored for its name and parameters and is invisible to `parity:api:calls`,
`parity:api:calls:args` and the arms report. trails PR 8523 moved
`ActionController::HttpAuthentication` into nested namespaces
(`packages/actionpack/src/action-controller/metal/http-authentication.ts`,
mirroring `actionpack/lib/action_controller/metal/http_authentication.rb`): its
three call-baseline rows went stale and its `base.rb` body pins were pruned, not
because the bodies were proven to match but because 33 bodies left the compared
population. `Configurable.ClassMethods`
(`packages/activesupport/src/configurable.ts`), `WithIntegrationRouting`
(`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`) and the
other `export namespace` modules are in the same position.

## Acceptance criteria

- `extractNamespace` records `calls`, `callSeq`, `callArgs` and `skeleton` for a
  function declaration and for a function-valued `const`, as
  `harvestObjectLiteralMethods` does, with an extractor test.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` compare namespace
  members. Every row that surfaces is converged in the body, or seeded with a
  reviewed reason in its own shard; the count that surfaced is in the PR body.
- `metal/http-authentication.ts` has body pins again.
