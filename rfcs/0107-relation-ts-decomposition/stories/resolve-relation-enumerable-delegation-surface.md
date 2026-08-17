---
title: "Resolve relation.ts's Enumerable/ActiveSupport delegation surface"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6622
claim: "2026-08-17T00:00:01Z"
assignee: "teach-call-args-regexp-flag-equivalence"
blocked-by: null
closed-reason: null
---

## Context

Coverage gap found in the 2026-08-16 refinement pass: classifying every member
of `relation.ts` against `relation.rb` + `relation/**/*.rb` and cross-checking
against every open story body left **233 lines across 18 members** owned by no
story. This is one of four groups closing that gap.

The **Enumerable / ActiveSupport delegation surface** — members with no `def` in
the Rails `activerecord` tree, because Rails gets them from `include Enumerable`
(`vendor/rails/activerecord/lib/active_record/relation.rb:67`) plus the
`delegate ... to: :records` list in
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb`:

| member          | `relation.ts` | lines | Ruby origin                                                                           |
| --------------- | ------------- | ----- | ------------------------------------------------------------------------------------- |
| `groupByColumn` | `:3273`       | 19    | **no counterpart** — Ruby is `Enumerable#group_by`; the `ByColumn` suffix is invented |
| `sortBy`        | `:2395`       | 17    | `Enumerable#sort_by`                                                                  |
| `compactBlank`  | `:2412`       | 16    | `Enumerable#compact_blank` (activesupport)                                            |
| `indexBy`       | `:3292`       | 14    | `Enumerable#index_by` (activesupport)                                                 |
| `detect`        | `:2381`       | 14    | `Enumerable#detect`                                                                   |
| `presence`      | `:2340`       | 9     | `Object#presence` (activesupport)                                                     |
| `sample`        | `:5299`       | 1     | `Array#sample`                                                                        |
| `rindex`        | `:5298`       | 1     | `Array#rindex`                                                                        |
| `shuffle`       | `:5301`       | 1     | `Array#shuffle`                                                                       |
| `toFormattedS`  | `:5308`       | 1     | `Object#to_formatted_s` (activesupport)                                               |

~93 lines.

The one-liners at `:5294-5309` are declaration-merge entries in the
`export interface Relation<T extends Base>` block — they are the trails spelling
of Rails' `delegate` list and are probably correct as a mechanism; what needs
checking is whether each name is on Rails' actual delegate list or was invented
alongside it.

`groupByColumn` is the clear invention: Ruby has `group_by`, and a
`_column`-suffixed variant is extra surface. `detect` and `sortBy` are real
Enumerable methods but are hand-implemented here with bespoke bodies
(`relation.ts:2381`, `:2395`) rather than delegated.

## Acceptance criteria

- Each member above is resolved: delegated through the `delegation.rb`
  mechanism if Rails delegates it, deleted if it is invented, or tagged
  `@noRailsEquivalent <reason>` with a permanence claim if it must stay.
- `groupByColumn` specifically is deleted or renamed to the Ruby name it
  actually mirrors — a `_column` suffix Ruby does not have is not a spelling
  choice.
- The hand-written `detect` / `sortBy` / `compactBlank` / `indexBy` bodies are
  replaced by delegation unless a documented TS shortcoming prevents it.
- `pnpm parity:api:extra --package activerecord` shows no new novel names for
  `relation.ts`; any surviving extra carries a tag.
- No behavior change; the `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative.
