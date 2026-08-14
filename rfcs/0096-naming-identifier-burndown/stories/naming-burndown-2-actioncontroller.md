---
title: "Burn down the remaining 28 naming call-argument rows in ActionController metal and base"
status: closed
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 112
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets actioncontroller; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in ActionController metal and base: **28 rows across 8 files**.

| Rows | File                                                            |
| ---: | --------------------------------------------------------------- |
|   10 | `packages/actioncontroller/metal/request-forgery-protection.ts` |
|    8 | `packages/actioncontroller/metal/strong-parameters.ts`          |
|    4 | `packages/actioncontroller/metal/http-authentication.ts`        |
|    2 | `packages/actioncontroller/base.ts`                             |
|    1 | `packages/actioncontroller/metal/data-streaming.ts`             |
|    1 | `packages/actioncontroller/metal/live.ts`                       |
|    1 | `packages/actioncontroller/metal/rendering.ts`                  |
|    1 | `packages/actioncontroller/test-case.ts`                        |

Representative rows (Ruby args → TS args):

- `base.ts#sendFile` calling `basename`: Ruby `ref:path` → TS `ref:filePath`
- `base.ts#sendFile` calling `basename`: Ruby `ref:path` → TS `ref:filePath`
- `metal/data-streaming.ts#sendFileHeadersBang` calling `lookup_by_extension`: Ruby `ref:delete` → TS `ref:ext`
- `metal/http-authentication.ts#httpBasicAuthenticateWith` calling `before_action`: Ruby `ref:options` → TS `ref:rest`
- `metal/http-authentication.ts#validateDigestResponse` calling `opaque`: Ruby `ref:secretKey` → TS `ref:sk`
- `metal/http-authentication.ts#authenticationHeader` calling `nonce`: Ruby `ref:secretKey` → TS `ref:sk`
- `metal/http-authentication.ts#authenticationHeader` calling `opaque`: Ruby `ref:secretKey` → TS `ref:sk`
- `metal/live.ts#sendStream` calling `lookup_by_extension`: Ruby `ref:delete` → TS `ref:ext`

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
