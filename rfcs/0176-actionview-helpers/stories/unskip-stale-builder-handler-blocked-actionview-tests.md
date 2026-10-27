---
title: "Un-skip the two actionview tests still BLOCKED on the landed Builder handler"
status: done
updated: 2026-10-27
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9358
claim: "2026-10-27T01:18:07Z"
assignee: "credit-helpers-eager-load-bang-in-api-compare"
blocked-by: null
closed-reason: null
---

## Context

`port-builder-template-handler` is done (Builder handler and
`build-views-precompiles-builder-templates` landed), but two actionview tests
are still skipped with `// BLOCKED: port-builder-template-handler` on
origin/main (7a1140c7b2):

- `packages/actionview/src/template/lookup-context.test.ts:174`
  "found templates have nil format if one cannot be found from template or handler"
- `packages/actionview/src/actionpack/controller/capture.test.ts:109`
  "non erb block content for"

Those two skips are part of the 41 in `pnpm parity:test --package actionview`
(2521/2562).

## Acceptance

- Un-skip both against the landed Builder handler and make them pass; or, if
  a real gap remains, re-mark each with the live blocker (story id) instead
  of the stale one.
