---
title: "activesupport: re-measure parity:api and parity:test on a clean build"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0246 measured activesupport at trails `4d6bf61e04`. The `parity:api` run
used `API_COMPARE_ALLOW_STALE_BUILD=1`, so its 2162/2289 figure is only
indicative.

## Acceptance criteria

- [ ] Run `pnpm build`, then `pnpm parity:api -- --package activesupport` and
      `pnpm parity:test -- --package activesupport --missing` on a clean
      checkout of main.
- [ ] Update the RFC 0246 Motivation tables with the fresh numbers. Move rows
      between stories if any owner changed.
- [ ] List the 13 inheritance mismatches, 4 arity mismatches and 3 misplaced
      files by name in the RFC, so the phase 4 stories can be scoped.
