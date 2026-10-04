---
title: "Array#first / #last / #shift answer undefined where MRI answers nil on an empty array"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ruby-compat's `first(ary)` and `last(ary)` (`packages/ruby-compat/src/array.ts`,
the no-argument arms) answer `undefined` for an empty array. MRI's `ary_first`
(`vendor/ruby/v3.3.11/array.c:1901`) and `ary_last` (`array.c:1907`) answer
`nil`, and their own JSDoc says "or `nil` for an empty array". trails spells
`nil` as `null`, so every caller whose result is observable has to coalesce at
its own call site.

Surfaced by trails#8480: `Thor::Arguments#peek` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:68-70`,
`@pile.first`) had to be written `first(this.pile) ?? null`
(`packages/trailties/src/thor/parser/arguments.ts`) so an empty pile answers
`nil`. `Arguments#shift` (`arguments.rb:72-74`) has the same coalesce over
`this.pile.shift()`, because ruby-compat has no `Array#shift` port
(`rb_ary_shift`, `array.c`) that answers `nil` on empty.

## Converged shape

- `first` / `last` return `T | null` and answer `null` for an empty array.
- An `Array#shift` port (no-argument arm) answers `null` for an empty array.
- `Thor::Arguments#peek` and `#shift` drop their `?? null` and read
  `first(this.pile)` / the shift port, line for line with the Ruby.
- Callers that currently rely on `undefined` (a `?? default`, a `!== undefined`
  test, an optional-typed local) are swept; there are many `first(` / `last(`
  call sites across packages, so size the sweep before starting.

## Acceptance criteria

- [ ] `first([])` and `last([])` answer `null`; their return types say so.
- [ ] `packages/trailties/src/thor/parser/arguments.ts` `peek` and `shift`
      carry no `?? null`.
- [ ] `pnpm typecheck` and the touched packages' tests pass; no caller gains a
      new coalesce to restore `undefined`.
