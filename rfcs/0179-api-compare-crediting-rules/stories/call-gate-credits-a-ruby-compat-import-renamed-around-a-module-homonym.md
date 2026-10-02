---
title: "parity: the call gate credits a ruby-compat import renamed around a module-level homonym"
status: draft
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/relation/finder-methods.ts` ports `FinderMethods#first`, `#last` and
`#take` as module-level functions, so the ruby-compat ports of `Array#first` / `#last` /
`#take` (`packages/ruby-compat/src/array.ts`, `vendor/ruby/v3.3.11/array.c:1901,1914,7532`)
cannot be imported under their own names there. The audit converged the five bodies below onto
those helpers through renamed imports (`first as aryFirst`, `last as aryLast`,
`take as aryTake`):

| Rails site                                                                                                               | TS body                                           |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:491-518` `ids.first` ×5 (`find_with_ids`) | `aryFirst(ids)`                                   |
| `finder_methods.rb:582-588` `records.first`, `limit(1).records.first` (`find_take`)                                      | `aryFirst(await this.records())`                  |
| `finder_methods.rb:590-596` `records.take(limit)` (`find_take_with_limit`)                                               | `aryTake(await this.records(), limit)`            |
| `finder_methods.rb:598-601` `find_nth_with_limit(index, 1).first` (`find_nth`)                                           | `aryFirst(await this.findNthWithLimit(index, 1))` |
| `finder_methods.rb:636-638` `limit ? records.last(limit) : records.last` (`find_last`)                                   | `aryLast(records, limit)` / `aryLast(records)`    |

The call gate still flags all five. `collectImportAliases`
(`scripts/api-compare/extract-ts-api.ts`) credits a renamed import back to its original name only
for a RELATIVE specifier (`./`, `../`), so `aryFirst(…)` is recorded as `aryFirst`, not
`first`. Widening it to every `@blazetrails/ruby-compat` rename is wrong: the repo renames
TOWARD the Ruby name far more often (`rbObjAsString as toS`, `rbInspect as inspect`,
`hasKey as isInclude`), and those calls must keep the local name.

The five bodies carry `@missingRailsCall first` / `take` / `last`.

## Acceptance criteria

- [ ] The TS extractor credits a call through a renamed `@blazetrails/ruby-compat` import under the ORIGINAL export name when the importing module declares a top-level binding of that name (the collision that forced the rename), and keeps the local name otherwise, with unit tests for both arms.
- [ ] The call-argument gate aligns the receiver of those function-form calls, or the PR body lists the `@missingRailsArgs` receipt each one needs and why (`FinderMethods#take` / `#last` are Rails-defined names, so `RECEIVER_AS_FIRST_ARG` cannot hold them by name).
- [ ] The five receipts above are deleted and `pnpm parity:api:calls` is green with no baseline row added.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args
```
