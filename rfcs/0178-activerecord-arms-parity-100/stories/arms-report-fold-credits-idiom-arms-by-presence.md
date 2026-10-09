---
title: "api-compare: the arms fold credits a Ruby uniq/concat with an arm whenever the port has any if/loop"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8353
claim: "2026-10-09T18:09:42Z"
assignee: "activerecord-sqlite3-new-client-is-one-async-body-with-timeout-in-configure-connection"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` still lists four `relation/`
pairs after `activerecord-converge-missing-control-flow-arms-relation` converged every branch those
bodies had dropped. Each remaining row is produced by the fold, not by the port. One cause:

**An idiom lowering is chosen by token PRESENCE, not by count.**
`skeletonIdiomLowering` (`scripts/api-compare/enumerable-idioms.ts:297-309`) takes the longest
alternative whose tokens the counterpart stream `includes`. A body with any unrelated `if` or `loop`
therefore credits every Ruby `uniq` / `concat` with an arm, even where the port names the call itself
(`uniq(xs)`) or spreads (`push(...xs)`), which emit no token:

- `relation/query-methods.ts#buildArel` — `-if -if`. Rails' two `uniq` calls
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1759,1772`) each fold
  to `if`; the port calls `uniq(...)` twice and has all ten of Rails' `if`s.
- `relation/query-methods.ts#structurallyIncompatibleValuesFor` — `-if -if`, the two `uniq` calls at
  `query_methods.rb:2272-2273`.
- `relation/query-methods.ts#buildJoinBuckets` — `-loop`, the `concat` at `query_methods.rb:1875`,
  ported `push(...stashedLeftJoins)`.
- `relation/calculations.ts#executeGroupedCalculation` — `-loop -loop`, the `uniq` at
  `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:516` (folded `loop if`)
  and the `concat` at `:544`.

The existing test "cannot hide an if the TS side dropped"
(`scripts/api-compare/fold-skeleton-tokens.test.ts`) pins the presence rule for `filter_map` on
purpose, so a plain count budget is not the fix. The narrower rule that does not weaken it: when the
counterpart names the idiom's own call (`ref:uniq` for Ruby `uniq`), that call IS the port and the
lowering is the empty alternative, one Ruby reach per TS reach.

A fifth row, `relation/calculations.ts#pluck` `-if`, is not tool noise: it is Rails' two
`if @async … Promise::Complete.new` arms (`calculations.rb:293-297,302-306`), which trails does not
port because it uses native promises.

## Acceptance criteria

- [ ] A Ruby idiom reach whose counterpart names the same call folds to its empty alternative,
      one reach per reach, with a `fold-skeleton-tokens.test.ts` case; the `filter_map` test stays green.
- [ ] The four pairs above leave the missing-direction report, and the report's total moves only down.
