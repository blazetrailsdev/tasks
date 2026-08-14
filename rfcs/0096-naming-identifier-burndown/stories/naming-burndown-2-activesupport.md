---
title: "Burn down the remaining 29 naming call-argument rows in activesupport cache and inflector"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 116
pr: 6433
claim: "2026-08-12T19:19:34Z"
assignee: "naming-burndown-2-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in activesupport cache and inflector: **29 rows across 17 files**.

| Rows | File                                                                     |
| ---: | ------------------------------------------------------------------------ |
|    7 | `packages/activesupport/inflector/inflections.ts`                        |
|    5 | `packages/activesupport/cache/entry.ts`                                  |
|    2 | `packages/activesupport/cache.ts`                                        |
|    2 | `packages/activesupport/message-pack/extensions.ts`                      |
|    1 | `packages/activesupport/cache/coder.ts`                                  |
|    1 | `packages/activesupport/cache/file-store.ts`                             |
|    1 | `packages/activesupport/cache/memory-store.ts`                           |
|    1 | `packages/activesupport/callbacks.ts`                                    |
|    1 | `packages/activesupport/string-inquirer.ts`                              |
|    1 | `packages/activesupport/hash-with-indifferent-access.ts`                 |
|    1 | `packages/activesupport/messages/metadata.ts`                            |
|    1 | `packages/activesupport/notifications/fanout.ts`                         |
|    1 | `packages/activesupport/number-helper/number-to-currency-converter.ts`   |
|    1 | `packages/activesupport/number-helper/number-to-percentage-converter.ts` |
|    1 | `packages/activesupport/number-helper/number-to-phone-converter.ts`      |
|    1 | `packages/activesupport/values/time-zone.ts`                             |
|    1 | `packages/activesupport/xml-mini.ts`                                     |

Representative rows (Ruby args → TS args):

- `cache.ts#fetch` calling `merged_options`: Ruby `ref:options` → TS `ref:callOptions`
- `cache.ts#fetch` calling `read`: Ruby `ref:name, ref:options` → TS `ref:name, ref:callOptions`
- `cache/coder.ts#tryCompress` calling `deflate`: Ruby `ref:string` → TS `ref:payload`
- `cache/entry.ts#value` calling `uncompress`: Ruby `ref:value` → TS `ref:_value`
- `cache/entry.ts#bytesize` calling `dump`: Ruby `ref:value` → TS `ref:_value`
- `cache/entry.ts#compressed` calling `dump`: Ruby `ref:value` → TS `ref:_value`
- `cache/entry.ts#compressed` calling `dump`: Ruby `ref:value` → TS `ref:_value`
- `cache/entry.ts#dupValueBang` calling `dump`: Ruby `ref:value` → TS `ref:_value`

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
