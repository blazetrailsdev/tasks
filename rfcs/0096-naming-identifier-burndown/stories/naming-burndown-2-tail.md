---
title: "Burn down the remaining 25 naming call-argument rows in the small packages — globalid, i18n, trailties, abstractcontroller, did-you-mean"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 100
pr: 6378
claim: "2026-08-11T21:06:02Z"
assignee: "burndown-arel-visitors"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in the small packages — globalid, i18n, trailties, abstractcontroller, did-you-mean: **25 rows across 13 files**.

| Rows | File                                                |
| ---: | --------------------------------------------------- |
|    5 | `packages/abstractcontroller/caching/fragments.ts`  |
|    4 | `packages/globalid/global-id.ts`                    |
|    3 | `packages/i18n/backend/base.ts`                     |
|    2 | `packages/globalid/locator.ts`                      |
|    2 | `packages/globalid/signed-global-id.ts`             |
|    2 | `packages/i18n/backend/key-value.ts`                |
|    1 | `packages/trailties/application.ts`                 |
|    1 | `packages/trailties/application/routes-reloader.ts` |
|    1 | `packages/trailties/engine/configuration.ts`        |
|    1 | `packages/trailties/paths.ts`                       |
|    1 | `packages/trailties/rack/logger.ts`                 |
|    1 | `packages/did-you-mean/spell-checker.ts`            |
|    1 | `packages/i18n/backend/flatten.ts`                  |

Representative rows (Ruby args → TS args):

- `caching/fragments.ts#writeFragment` calling `instrument_fragment_cache`: Ruby `str:writeFragment, ref:key` → TS `str:writeFragment, ref:combined`
- `caching/fragments.ts#writeFragment` calling `write`: Ruby `ref:key, ref:content, ref:options` → TS `ref:combined, ref:content, ref:options`
- `caching/fragments.ts#readFragment` calling `instrument_fragment_cache`: Ruby `str:readFragment, ref:key` → TS `str:readFragment, ref:combined`
- `caching/fragments.ts#readFragment` calling `read`: Ruby `ref:key, ref:options` → TS `ref:combined, ref:options`
- `caching/fragments.ts#fragmentExist` calling `instrument_fragment_cache`: Ruby `str:exist_fragment?, ref:key` → TS `str:exist_fragment?, ref:combined`
- `application.ts#keyGenerator` calling `new`: Ruby `ref:secretKeyBase, kwargs{iterations=num:1000}` → TS `ref:secret, kwargs{iterations=num:1000}`
- `application/routes-reloader.ts#executeUnlessLoaded` calling `run_load_hooks`: Ruby `str:afterRoutesLoaded, ref:application` → TS `str:afterRoutesLoaded, ref:app`
- `engine/configuration.ts#paths` calling `new`: Ruby `ref:root` → TS `ref:_root`

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
