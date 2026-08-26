---
title: "time-ext-rubytime-arms-delegate-to-time-reopening"
status: draft
updated: 2026-08-26
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activesupport-core-ext-time-calculations-on-time-class` ported
`core_ext/time/calculations.rb` onto trails' `Time`
(`packages/activesupport/src/core-ext/time/calculations.ts`, the mixin idiom
over `packages/date/src/time.ts`). `RUBY_FILE_TS_OVERRIDES` now points
`activesupport:core_ext/time/calculations.rb` at that file and the bucket reads
38/38.

What that PR deliberately left standing is `packages/activesupport/src/time-ext.ts`
— the `@boundary-file` module of free functions taking a JS `Date`. Two of its
exports carry a `RubyTime` receiver overload that now duplicates the reopening:

- `change` (`time-ext.ts:474-650`) — its `date instanceof RubyTime` branches
  reproduce `time/calculations.rb:145-177` a second time.
- `advance` (`time-ext.ts:299-360`) — same, for `time/calculations.rb:194-217`.

Both should become `return date.change(options)` / `return date.advance(options)`
against the reopening, so there is one implementation of each Rails body. Check
the module-eval graph first: `time-ext.ts` importing
`core-ext/time/calculations.ts` must not close a TDZ cycle (CLAUDE.md
"Call-time constant resolution"), and the check is a plain-node import of the
BUILT `dist/**.js` entry modules, not a vitest run.

The wider question — whether the JS-`Date`-receiver arms of `time-ext.ts` should
exist at all, or whether every caller should hold a `Time` — belongs with
`activesupport-core-ext-calculations-delegation`, not here.

## Acceptance criteria

- `time-ext.ts`'s `change` and `advance` have no `RubyTime` implementation of
  their own; the `RubyTime` overload delegates to the `Time` method.
- Entry-module import of the built `dist/time-ext.js` and
  `dist/core-ext/time/calculations.js` under plain node succeeds.
- `pnpm parity:api`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args`,
  `pnpm parity:api:extra` non-regressing.
