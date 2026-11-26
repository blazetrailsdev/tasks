---
title: "parity:api:exports: a ported public name reaches its package entry"
status: draft
updated: 2026-11-26
rfc: "0260-parity-gates-catch-semantic-drift"
cluster: parity-gates
packages: [scripts, actionview]
deps: []
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

RFC Design §4. `javascriptIncludeTag` and `preloadLinkTag` were ported in
`packages/actionview/lib/helpers/asset-tag-helper.ts` but not exported from
`helpers/index.ts`, and an app could not import them until trails#10792. The
gates score declarations, not what a consumer can import.

## Acceptance criteria

- [ ] `pnpm parity:api:exports` lists every matched public Ruby method / module / constant whose TS counterpart is a top-level export in `lib/` but is not reachable from any `exports` entry in the package's `package.json`.
- [ ] A helper method reached through its module's export counts as reached.
- [ ] Gate is only-shrink with a per-package mark; wired into `parity:changed` and CI; documented in `docs/parity-gates.md`.
