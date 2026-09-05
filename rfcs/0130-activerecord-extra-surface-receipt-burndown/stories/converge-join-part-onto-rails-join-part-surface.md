---
title: "converge-join-part-onto-rails-join-part-surface"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/join-dependency/join-part.ts` carries six
mutable public fields that Rails' `JoinPart` does not have:
`assocName`, `assocType`, `effectiveSqlName`, `immediateAssocName`, `parentPath`,
`tableIndex`.

Rails' `JoinPart`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_part.rb:12-67`)
holds only `base_klass`, `children`, the `table_name` / `column_names` /
`primary_key` / `attribute_types` delegations, `match?`, `each`,
`each_children`, `table`, `extract_record` and `instantiate`. It has no notion of
a path, an assoc name, an assoc macro, a table index or an "effective SQL name" —
Rails carries all of that in the `Aliases` / `AliasTracker` pair
(`join_dependency.rb:16-70`, `alias_tracker.rb`) and in the `JoinAssociation`'s
own `reflection`.

trails uses the six as a parallel index: `join-dependency.ts:170-178`
(`_assignPaths`) writes `parentPath` / `assocName`, `:199-220`
(`addAssociation`) writes `tableIndex` / `effectiveSqlName` /
`immediateAssocName` / `assocType`, and `:187`, `:314`, `:382`, `:426-440`,
`:568-580`, `:634-640`, `:685`, `:736-790` read them back, as does
`support/join-dependency-aliased-row.ts:14`.

The receipt burndown (RFC 0130) tagged all six
`@noRailsEquivalent CONVERGEABLE <this story>` rather than leaving them
uncounted; this story is the receipt.

## Acceptance criteria

- `JoinPart`'s public surface is Rails': `baseKlass`, `children`, the four
  delegations, `isMatch`, `each`, `eachChildren`, `table`, `extractRecord`,
  `instantiate`.
- The path/index information the six fields carry is derived where Rails derives
  it — the reflection on `JoinAssociation`, and `Aliases` / `AliasTracker` for
  the SQL name and column aliases.
- The six `@noRailsEquivalent CONVERGEABLE` tags in `join-part.ts` are deleted.
- `pnpm parity:api:extra --package activerecord` shows `join-part.ts` at 0
  novel and the extra-surface mark is tightened.
- The association and eager-loading suites stay green on all three lanes.
