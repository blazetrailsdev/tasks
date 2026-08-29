---
title: "Port Time's *_with_coercion / *_with_duration named methods onto the reopened Time class"
status: blocked
updated: 2026-08-29
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-08-29T17:33:51Z"
assignee: "param-drift-relation-new-alias-scored-as-constructor"
blocked-by: "Blocked on unported Ruby core methods the *_with_* halves delegate to: @blazetrails/date's Time has no to_f, no <=> (compare) and no eql? (packages/date/src/time.ts — only plus/minus/toI/toDatetime exist), so minus_with_coercion's DateTime arm (to_f - other.to_f, time/calculations.rb:319), compare_with_coercion's three compare_without_coercion calls (:328-337) and eql_with_coercion's eql_without_coercion (:345) have nothing to call. The story's premise that 'the without method IS the date package's own Time#minus/Time#compare' holds only for minus. The two *_with_duration halves are separately blocked: Duration#since/#until bottom out in applyDurationPreservingNs (duration.ts:727-735), which accepts only Date/Instant/PlainDate and raises ArgumentError for a ::Time receiver, so other.since(self) (:298) cannot run. Unblocks once Time#to_f/#<=>/#eql? are ported in @blazetrails/date and Duration's application seam accepts a ::Time."
closed-reason: null
---

## Context

`core_ext/time/calculations.rb:296-357` installs four `alias_method` chains on
`Time`, each pairing a redefined operator with a NAMED method that carries the
actual coercion logic:

- `minus_with_coercion` (`:317-320`) — `other.comparable_time` when the argument
  answers it, then `to_f - other.to_f` for a `DateTime`, else the core `-`.
- `compare_with_coercion` (`:324-338`) — the `other.class == Time` fast path, the
  `is_a?(Time)` arm going through `comparable_time` / `to_time`, else
  `to_datetime <=> other`.
- `eql_with_coercion` (`:342-346`) — `comparable_time` coercion before the core
  `eql?`.
- `plus_with_duration` / `minus_with_duration` (`:296-314`) — `Duration === other`
  dispatch to `other.since(self)` / `other.until(self)`.

All of these — plus their `*_without_*` halves and the bare `+`/`-`/`<=>`/`eql?`
— sit in one `SCOPED_SKIP_GROUPS` entry scoped to this Ruby file
(`scripts/parity/conventions.ts:604-627`). Its reason:

> JS has no operator overloading and no way to reopen `Date`'s operators, so
> trails' ported arithmetic is the plain `since`/`ago`/`compare` functions and
> the chain halves have no receiver to attach to.

That reason is correct for the BARE operators and for the `*_without_*` halves.
It is **wrong for the `*_with_*` methods**, for the same reason it was found
wrong for `Time.at` (see `time-at-with-coercion-onto-time-class`): they are
ordinary named methods, and since PR #7078 trails reopens `Time` from
activesupport (`packages/activesupport/src/core-ext/time/calculations.ts`), so
they now have both a receiver and the mixin idiom to attach to. The skip entry
predates the reopening and was never revisited against it.

Rails' own tests exercise these by name — `time_ext_test.rb` has
`test_minus_with_time_with_zone`, `test_minus_with_datetime`,
`test_compare_with_time`, `test_compare_with_datetime`,
`test_compare_with_time_with_zone`, `test_compare_with_string` and `test_eql?`.
`packages/activesupport/src/core-ext/time-ext.test.ts` already carries those
names, but against JS-`Date` free functions rather than the `Time` receiver.

## Converged shape

`minusWithCoercion`, `compareWithCoercion`, `eqlWithCoercion`,
`plusWithDuration` and `minusWithDuration` as `this: RubyTime` functions in
`core-ext/time/calculations.ts`, assigned onto `Time` by the same
`Object.assign(RubyTime.prototype, ...)` the rest of that file uses. The bare
operators stay unported (JS genuinely cannot overload them) and the
`*_without_*` halves stay skipped — in trails the "without" method IS the date
package's own `Time#minus`/`Time#compare`, so there is nothing separate to name.

The `SCOPED_SKIP_GROUPS` entry must be SPLIT accordingly, with the surviving
group's reason narrowed to the bare operators and the `*_without_*` halves it
actually describes.

## Acceptance criteria

- The five `*_with_*` methods live on trails' `Time` at the Rails names, in
  `core-ext/time/calculations.ts`, with Rails' control flow and branch order.
- The `SCOPED_SKIP_GROUPS` entry is split; the remaining reason describes only
  what it still covers. Never widen it.
- Rails' `test_minus_with_*` / `test_compare_with_*` / `test_eql?` names are
  exercised against the `Time` receiver.
- `pnpm parity:api` activesupport ported-method count up by the names leaving
  the skip group; `parity:api:calls`, `parity:api:extra` green.
