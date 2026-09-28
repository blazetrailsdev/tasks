---
title: "Close RFC 0161 — call baselines and residue to zero"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "renderers-registry-and-renderers-class-attribute",
    "renderer-normalize-env-and-moved-readers",
    "abstract-rendering-hooks-and-default-form-builder",
    "streaming-and-api-rendering-fold-invented-helpers",
    "port-live-stream-test-threads-and-router",
    "port-renderers-and-format-render-tests",
    "controller-template-resolver-is-invented-surface",
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

Call baseline rows on files this RFC owns, under
`scripts/api-compare/call-mismatches-exclude/actioncontroller/`:
`metal/live.json` (5) and `metal/rendering.json` (1). `renderer.json` (2) is
retired by `renderer-normalize-env-and-moved-readers`.

`pnpm parity:api:extra --package actioncontroller` also scores
`metal/live.ts`'s `stream` as moved.

## Acceptance criteria

- Each remaining row is converged by making the TS body call what Rails calls,
  then deleted by hand and the mark tightened. No reseed.
- `stream` on `metal/live.ts` is removed or relocated to the file that mirrors
  the `.rb` defining it.
- Every Verification bullet in the RFC README holds.
