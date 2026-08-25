---
title: "Burn down the remaining 50 naming call-argument rows in ActionDispatch routing/, middleware/ and testing/"
status: closed
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets actiondispatch; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in ActionDispatch routing/, middleware/ and testing/: **50 rows across 23 files**.

| Rows | File                                                                       |
| ---: | -------------------------------------------------------------------------- |
|    6 | `packages/actiondispatch/routing/mapper.ts`                                |
|    5 | `packages/actiondispatch/middleware/debug-exceptions.ts`                   |
|    5 | `packages/actiondispatch/routing/url-for.ts`                               |
|    4 | `packages/actiondispatch/routing/inspector.ts`                             |
|    3 | `packages/actiondispatch/middleware/ssl.ts`                                |
|    3 | `packages/actiondispatch/routing/route-set.ts`                             |
|    2 | `packages/actiondispatch/middleware/debug-locks.ts`                        |
|    2 | `packages/actiondispatch/middleware/exception-wrapper.ts`                  |
|    2 | `packages/actiondispatch/middleware/show-exceptions.ts`                    |
|    2 | `packages/actiondispatch/routing/polymorphic-routes.ts`                    |
|    2 | `packages/actiondispatch/system-testing/test-helpers/screenshot-helper.ts` |
|    2 | `packages/actiondispatch/testing/assertions/routing.ts`                    |
|    2 | `packages/actiondispatch/testing/test-request.ts`                          |
|    1 | `packages/actiondispatch/middleware/executor.ts`                           |
|    1 | `packages/actiondispatch/middleware/host-authorization.ts`                 |
|    1 | `packages/actiondispatch/middleware/public-exceptions.ts`                  |
|    1 | `packages/actiondispatch/middleware/remote-ip.ts`                          |
|    1 | `packages/actiondispatch/middleware/request-id.ts`                         |
|    1 | `packages/actiondispatch/middleware/static.ts`                             |
|    1 | `packages/actiondispatch/system-test-case.ts`                              |
|    1 | `packages/actiondispatch/testing/assertion-response.ts`                    |
|    1 | `packages/actiondispatch/testing/test-helpers/page-dump-helper.ts`         |
|    1 | `packages/actiondispatch/testing/test-response.ts`                         |

Representative rows (Ruby args → TS args):

- `middleware/debug-exceptions.ts#invokeInterceptors` calling `log_error`: Ruby `ref:request, ref:wrapper` → TS `ref:env, ref:wrapper`
- `middleware/debug-exceptions.ts#renderException` calling `log_error`: Ruby `ref:request, ref:wrapper` → TS `ref:env, ref:wrapper`
- `middleware/debug-exceptions.ts#renderException` calling `api_request?`: Ruby `ref:contentType` → TS `ref:negotiated`
- `middleware/debug-exceptions.ts#logError` calling `log_rescued_responses?`: Ruby `ref:request` → TS `ref:env`
- `middleware/debug-exceptions.ts#logError` calling `log_array`: Ruby `ref:logger, ref:message, ref:request` → TS `ref:logger, ref:lines, ref:env`
- `middleware/debug-locks.ts#renderDetails` calling `blocked_by?`: Ruby `ref:info, ref:binfo, ref:values` → TS `ref:info, ref:binfo, ref:allInfos`
- `middleware/debug-locks.ts#renderDetails` calling `blocked_by?`: Ruby `ref:binfo, ref:info, ref:values` → TS `ref:binfo, ref:info, ref:allInfos`
- `middleware/exception-wrapper.ts#extractSource` calling `source_fragment`: Ruby `ref:file, ref:lineNumber` → TS `ref:file, ref:line`

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
