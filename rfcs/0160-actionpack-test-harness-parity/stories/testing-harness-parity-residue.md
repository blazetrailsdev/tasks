---
title: "Close RFC 0160 — call baselines and residue to zero"
status: ready
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "test-case-missing-methods-and-arity",
    "integration-session-delegated-readers-and-host-bang",
    "test-case-invented-assertion-helpers-removed",
    "port-test-case-test-assertions-and-naming",
    "port-integration-test-application-and-encoders",
    "port-routing-assertions-test-and-with-routing",
    "port-assertion-and-test-request-response-skips",
    "remove-invented-integration-test-assertions",
    "port-action-pack-assertions-routing-and-redirect-skips",
    "port-integration-runner-module-and-runner-tests",
    "port-integration-test-encoders-file-upload-and-page-dump",
    "port-routing-assertions-shared-tests-module",
    "port-abstract-unit-controller-reopenings-and-rack-test-case",
    "converge-inline-fixture-resolvers-onto-fixture-load-path",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the other stories land, ten call baseline rows remain on files this RFC
owns, under `scripts/api-compare/call-mismatches-exclude/`:

- `actioncontroller/test-case.json` — 2
- `actiondispatch/testing/assertions/response.json` — 2
- `actiondispatch/testing/test-response.json` — 2
- `actiondispatch/testing/assertion-response.json` — 1
- `actiondispatch/testing/assertions/routing.json` — 1
- `actiondispatch/testing/request-encoder.json` — 1
- `actiondispatch/testing/test-helpers/page-dump-helper.json` — 1

Each row says the trails body omits, or passes different arguments to, a call
the Rails body makes.

`pnpm parity:api:extra --package actiondispatch` also scores the constructor on
`packages/actionpack/src/action-dispatch/testing/test-request.ts` as moved.

## Acceptance criteria

- Each row is converged by making the TS body call what Rails calls, then
  deleted by hand; the high-water marks are tightened with
  `pnpm parity:api:calls:tighten <shard>`. No reseed.
- A row that cannot converge carries a `@missingRailsCall … — PERMANENT` or
  `@missingRailsArgs … — PERMANENT` receipt only where CLAUDE.md already ratifies
  the shortcoming. Anything else is filed as a story before this one closes.
- `testing/test-request.ts`'s constructor is relocated or removed so the file has
  no moved name.
- Every Verification bullet in the RFC README holds.
