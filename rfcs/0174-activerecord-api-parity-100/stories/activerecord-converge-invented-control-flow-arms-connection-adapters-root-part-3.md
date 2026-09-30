---
title: "activerecord: remove or credit the 10 invented branches in connection-adapters-root part 3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-connection-adapters-part-1"]
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `connection-adapters/sqlite3-adapter.ts#connect` — `+if +throw +if`
- `connection-adapters/sqlite3-adapter.ts#newClient` — `+if +if +try`
- `connection-adapters/statement-pool.ts#set` — `+if`
- `connection-adapters/statement-pool.ts#clear` — `+if`
- `connection-adapters/statement-pool.ts#delete` — `+if`
- `connection-adapters/statement-pool.ts#cache` — `+if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
