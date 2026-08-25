---
title: "Burn down the remaining 39 naming call-argument rows in rack"
status: closed
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 156
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets rack; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in rack: **39 rows across 16 files**.

| Rows | File                                   |
| ---: | -------------------------------------- |
|   11 | `packages/rack/multipart/parser.ts`    |
|    7 | `packages/rack/request.ts`             |
|    3 | `packages/rack/events.ts`              |
|    2 | `packages/rack/builder.ts`             |
|    2 | `packages/rack/files.ts`               |
|    2 | `packages/rack/response.ts`            |
|    2 | `packages/rack/static.ts`              |
|    2 | `packages/rack/utils.ts`               |
|    1 | `packages/rack/common-logger.ts`       |
|    1 | `packages/rack/conditional-get.ts`     |
|    1 | `packages/rack/directory.ts`           |
|    1 | `packages/rack/method-override.ts`     |
|    1 | `packages/rack/mock-response.ts`       |
|    1 | `packages/rack/multipart/generator.ts` |
|    1 | `packages/rack/query-parser.ts`        |
|    1 | `packages/rack/show-exceptions.ts`     |

Representative rows (Ruby args → TS args):

- `builder.ts#toApp` calling `generate_map`: Ruby `ref:run, ref:map` → TS `ref:_run, ref:_map`
- `builder.ts#toApp` calling `call`: Ruby `ref:app` → TS `ref:e`
- `common-logger.ts#log` calling `extract_content_length`: Ruby `ref:responseHeaders` → TS `ref:headers`
- `conditional-get.ts#fresh` calling `modified_since?`: Ruby `ref:modifiedSince, ref:headers` → TS `ref:parsed, ref:headers`
- `directory.ts#listDirectory` calling `stat`: Ruby `ref:join` → TS `ref:fullEntry`
- `events.ts#call` calling `on_commit`: Ruby `ref:request, ref:response` → TS `ref:req, ref:res`
- `events.ts#call` calling `on_error`: Ruby `ref:request, ref:response, ref:e` → TS `ref:req, ref:res, ref:error`
- `events.ts#call` calling `on_finish`: Ruby `ref:request, ref:response` → TS `ref:req, ref:res`

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-2 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `pnpm parity:api:calls:args:report` (after
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` on a fresh `pnpm build`)
      shows the `naming` class down by the rows this story converged, and no
      new `shape` rows.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` and the touched packages' tests pass; no public API change.
