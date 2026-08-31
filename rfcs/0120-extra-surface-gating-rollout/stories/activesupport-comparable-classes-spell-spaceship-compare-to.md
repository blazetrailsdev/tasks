---
title: "TimeWithZone and TimeZone spell Ruby <=> as compareTo, not compare"
status: draft
updated: 2026-08-31
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7289 (RFC 0126), which added the `Comparable` row to
`CORE_MIXIN_METHODS` and, in measuring its population, found the two
`include Comparable` classes in activesupport spell Ruby `<=>` as `compareTo`
rather than the repo's settled `compare`:

- `ActiveSupport::TimeWithZone#<=>` (`activesupport/lib/active_support/time_with_zone.rb:231`)
  → `packages/activesupport/src/time-with-zone.ts:949` `compareTo`
- `ActiveSupport::TimeZone#<=>` (`activesupport/lib/active_support/values/time_zone.rb:333`)
  → `packages/activesupport/src/values/time-zone.ts:1045` `compareTo`

`compare` is the settled trails spelling for `<=>`, in both registers that
resolve it: `MIRROR_CANDIDATE_OVERRIDES` in
`scripts/api-compare/extra-surface.ts` maps `"<=>": ["compare"]`, and
`OPERATOR_SPELLING_BY_FQN` in `scripts/api-compare/operator-order-spelling.ts`
pins `compare` for every other class that ports it —
`ActiveModel::Name`, `ActiveRecord::Core`, and
`ActiveRecord::ConnectionAdapters::AbstractAdapter::Version` among them.

Because `compareTo` matches neither, both files report it as **novel extra
surface** today: `pnpm parity:api:extra --package activesupport` lists
`compareTo` in the novel set for `time-with-zone.ts` (10 novel) and
`values/time-zone.ts` (5 novel). Renaming discharges one novel row in each.

Note `ActiveModel::Name` is a third `include Comparable` class and already
spells it `compare`, so this is a two-file divergence from an otherwise
uniform convention, not a missing convention.

## Converged shape

Rename `compareTo` → `compare` on both classes, updating the call sites
(`time-with-zone.ts:968` `equals`, `:1001` `between`, `:1039` `isBefore`,
`:1043` `isAfter`; `values/time-zone.ts:877` and `:1341`, both
`.sort((a, b) => a.compareTo(b) ?? 0)`), plus any cross-package callers.

`TimeZone#compare` keeps its `number | undefined` return: Ruby's
`TimeZone#<=>` returns `nil` for a non-`TimeZone` argument
(`values/time_zone.rb:333-337`), which is the `nil` arm Comparable's operators
turn into an `ArgumentError`. Do not flatten it to `number` while renaming.

## Acceptance criteria

1. Neither `time-with-zone.ts` nor `values/time-zone.ts` declares `compareTo`;
   both declare `compare`.
2. `pnpm parity:api:extra --package activesupport` reports one fewer novel
   name for each of the two files.
3. `pnpm parity:api` method and file deltas are non-negative.
