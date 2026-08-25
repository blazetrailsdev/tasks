---
title: "Burn down the remaining 31 naming call-argument rows in ActionView helpers, lookup context and renderers"
status: closed
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 124
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets actionview; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in ActionView helpers, lookup context and renderers: **31 rows across 14 files**.

| Rows | File                                                  |
| ---: | ----------------------------------------------------- |
|    6 | `packages/actionview/helpers/tag-helper.ts`           |
|    5 | `packages/actionview/lookup-context.ts`               |
|    3 | `packages/actionview/helpers/capture-helper.ts`       |
|    3 | `packages/actionview/helpers/number-helper.ts`        |
|    2 | `packages/actionview/path-registry.ts`                |
|    2 | `packages/actionview/renderer/template-renderer.ts`   |
|    2 | `packages/actionview/template/handlers.ts`            |
|    2 | `packages/actionview/view-paths.ts`                   |
|    1 | `packages/actionview/buffers.ts`                      |
|    1 | `packages/actionview/helpers/date-helper.ts`          |
|    1 | `packages/actionview/helpers/output-safety-helper.ts` |
|    1 | `packages/actionview/helpers/text-helper.ts`          |
|    1 | `packages/actionview/path-set.ts`                     |
|    1 | `packages/actionview/renderer/abstract-renderer.ts`   |

Representative rows (Ruby args → TS args):

- `buffers.ts#toString` calling `html_safe`: Ruby `ref:rawBuffer` → TS `ref:_raw`
- `helpers/capture-helper.ts#contentFor` calling `set`: Ruby `ref:name, ref:content` → TS `ref:name, ref:body`
- `helpers/capture-helper.ts#contentFor` calling `append`: Ruby `ref:name, ref:content` → TS `ref:name, ref:body`
- `helpers/capture-helper.ts#provide` calling `append!`: Ruby `ref:name, ref:content` → TS `ref:name, ref:body`
- `helpers/date-helper.ts#timeAgoInWords` calling `distance_of_time_in_words`: Ruby `ref:fromTime, ref:now, ref:options` → TS `ref:fromTime, ref:constructor, ref:options`
- `helpers/number-helper.ts#numberToPhone` calling `number_to_phone`: Ruby `ref:number, ref:options` → TS `ref:asArg, ref:opts`
- `helpers/number-helper.ts#delegateNumberHelperMethod` calling `escape_unsafe_options`: Ruby `ref:symbolizeKeys` → TS `ref:options`
- `helpers/number-helper.ts#validFloat` calling `parse_float`: Ruby `ref:number, bool:false` → TS `ref:n, bool:false`

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
