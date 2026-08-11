---
title: "Rename locals/params to Rails' across the rest of activerecord"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6354
claim: "2026-08-11T12:54:17Z"
assignee: "naming-burndown-activerecord-rest"
blocked-by: null
closed-reason: null
---

## Context

Burn down the 291 `naming` call-argument rows in the remaining `packages/activerecord/src/` files (tasks/database-tasks.ts 31 is the largest); split into bundles at claim time if one exceeds the LOC ceiling.

Rows are the `naming` class of `output/call-arg-mismatches.json` (RFC 0095):
a ported call site passes an argument whose local/parameter identifier was
renamed away from Rails'. List them with

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:calls:args:report
```

and filter the artifact to `class === "naming"` for this story's files.

## Acceptance criteria

1. Every local/parameter identifier named in this story's files is renamed to
   the Rails identifier, camelCased per `docs/ruby-ts-conventions.md`. Rename to
   the RAILS name, not to a better one — if Rails calls it `o`, it is `o`.
2. No public surface changes and no behavior changes: these are body-local
   identifiers. `pnpm parity:api:extra` and `pnpm parity:api` are unchanged.
3. The package's `naming` row count in `pnpm parity:api:calls:args:report` drops by the
   rows converged; report before/after in the PR body.
4. A row that turns out to be an argument-ORDER defect or an invented
   helper/conversion at the call site is NOT renamed away — file it against the
   RFC owning that file and leave the row.
5. Files touched stay within this story's set, so sibling burndown PRs do not
   conflict.
