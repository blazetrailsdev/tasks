---
title: "Drop dead disconnected.test.ts ref in normalize-skips.ts"
status: ready
updated: 2026-06-26
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4166 deleted `packages/activerecord/src/disconnected.test.ts` (RFC 0043
extra-test burndown). `scripts/test-compare/normalize-skips.ts:812` still has a
branch `if (p === "invalid-connection.test.ts" || p === "disconnected.test.ts")`
that supplies skip-reason metadata. The `disconnected.test.ts` arm is now an
inert dead reference — the file no longer exists. It was left in place to keep
PR #4166 within its one-file-per-PR scope.

## Acceptance criteria

- Remove the `|| p === "disconnected.test.ts"` clause at
  `scripts/test-compare/normalize-skips.ts:812`, keeping the
  `invalid-connection.test.ts` handling intact.
- No change to test:compare/api:compare parity metrics.
