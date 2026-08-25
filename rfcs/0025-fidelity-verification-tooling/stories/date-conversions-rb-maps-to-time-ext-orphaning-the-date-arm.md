---
title: "core_ext/date/conversions.rb maps to time-ext.ts, orphaning the Date-receiver conversions file"
status: draft
updated: 2026-08-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6457, which ported `Date#to_time`
(`activesupport/lib/active_support/core_ext/date/conversions.rb:83-86`) into a
new `packages/activesupport/src/core-ext/date/conversions.ts` — the path
`docs/ruby-ts-conventions.md` produces from the Ruby path, and the sibling of
the already-mapped `core-ext/date/calculations.ts`.

`scripts/parity/conventions.ts:243` maps that Ruby file elsewhere:

```ts
"activesupport:core_ext/date/conversions.rb": "time-ext.ts",
```

so the new file reports as `[no Rails counterpart]` and its `toTime` shows up in
`pnpm parity:api:extra` as `moved` surface, while `Date#to_time` stays counted
against `time-ext.ts` where it is not implemented.

Repointing the override is a **-2 method** delta on activesupport measured on
that PR (1163 -> 1161), which is why it was not done there. The cause is
double-crediting, not real coverage: `time-ext.ts` exports `toFs` and
`xmlschema`, which satisfy the same-named methods in BOTH
`core_ext/date/conversions.rb:49,95` and `core_ext/time/conversions.rb`. Point
`date/conversions.rb` at its own file and the Date-side credit for those two
disappears, because only the Time-side implementations exist.

`Date#to_time` cannot simply live in `time-ext.ts`: the name is already taken
there by `Time#to_time` (`time-ext.ts:662`, over a JS `Date`), and Ruby's two
receivers collapse onto one TS identifier.

## Converged shape

Repoint `"activesupport:core_ext/date/conversions.rb"` to
`"core-ext/date/conversions.ts"`, and port the Date-receiver `to_fs`
(`conversions.rb:49-61`), `readable_inspect` (`:63-65`) and `xmlschema`
(`:95-97`) into that file over `Temporal.PlainDate`, so the -2 becomes a
positive delta rather than a regression. `DATE_FORMATS` (`:6-22`) is the table
`to_fs` reads.

Verify with `pnpm parity:api --package activesupport` before/after: methods and
files must both be non-negative, and `core-ext/date/conversions.ts` must stop
reporting `[no Rails counterpart]` in `pnpm parity:api:extra`.

## Acceptance criteria

1. `core_ext/date/conversions.rb` maps to `core-ext/date/conversions.ts` in
   `scripts/parity/conventions.ts` (never by hand-editing the generated doc).
2. The Date-receiver conversions live in that file at their Rails names, and
   `toTime` no longer reports as `moved` extra surface.
3. `pnpm parity:api --package activesupport` method and file deltas are
   non-negative.

## Re-verified 2026-08-17 (draft sweep)

Still valid. `scripts/parity/conventions.ts:249` (was `:243`) still maps
`"activesupport:core_ext/date/conversions.rb": "time-ext.ts"`, and
`packages/activesupport/src/core-ext/date/conversions.ts` still exists and is
still orphaned by it.
