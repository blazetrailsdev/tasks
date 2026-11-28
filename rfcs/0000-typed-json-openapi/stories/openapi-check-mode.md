---
title: "trails-tsc openapi: --check fails when the document differs from the committed copy"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
cluster: openapi
packages: [trails-tsc]
deps: [openapi-extract-routes-and-render-types]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 4, step 4. CI needs to see API changes, so `--check` regenerates
the document and diffs it against a committed copy.

## Acceptance criteria

- [ ] `trails-tsc --openapi --check` exits 0 when they match, and non-zero with a
      diff summary (the operations changed) when they don't.
- [ ] Key order is deterministic, so a no-op rebuild never diffs.

## Verification

`pnpm vitest run packages/trails-tsc/test/plugins/openapi-check.test.ts`.
