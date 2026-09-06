---
title: "UnexpectedError sits inside DEFAULT_RESCUE, so handle swallows it under debugMode"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: message-string-parity
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ErrorReporter::UnexpectedError` is `Class.new(Exception)` in Rails
(`vendor/rails/activesupport/lib/active_support/error_reporter.rb:33`) —
deliberately **outside** `StandardError`, so the error `unexpected` raises under
`debug_mode` (`:148-150`) is not swallowed by a `rescue` higher in the stack.

`handle`/`record` rescue `DEFAULT_RESCUE = [StandardError].freeze` (`:29`,
`:79`, `:115`). Because Ruby's `UnexpectedError < Exception` sits above
`StandardError`, this holds in Rails:

```ruby
Rails.error.debug_mode = true
Rails.error.handle { Rails.error.unexpected("boom") }   # => raises UnexpectedError
```

The trails port (PR #6302, `packages/activesupport/src/error-reporter.ts`)
declares `static readonly UnexpectedError = class extends Error` and
`DEFAULT_RESCUE = Object.freeze([Error])`, because JS has no class below `Error`
to express "not rescuable by the default rescue". So the same code **swallows**:
`handle` catches the `UnexpectedError` and reports it instead of letting it
surface to the developer, which is the entire point of `debug_mode`.

The deviation is flagged at the call site in the `UnexpectedError` JSDoc, but the
behavioural gap is real and untested — no ported test covers `unexpected` raised
inside `handle`, which is why it is invisible today.

## Converged shape

Model the one distinction Rails depends on. Options, cheapest first:

- Give `DEFAULT_RESCUE`'s rescue check the `Exception`-vs-`StandardError` split
  directly: a module-private brand on `UnexpectedError` that `rescues()`
  (`error-reporter.ts`) treats as non-rescuable, mirroring the hierarchy without
  inventing a class. Smallest diff; keeps `UnexpectedError instanceof Error`
  true for callers.
- Introduce a real `StandardError` in `@blazetrails/activesupport` and make
  `DEFAULT_RESCUE = [StandardError]`, with `UnexpectedError` extending `Error`
  but not `StandardError`. Truer to Ruby's tree, but every error class in the
  repo that Rails rescues by default would have to descend from it for
  `handle`/`record` to keep working — check the blast radius before choosing
  this arm.

Either way, add the case Rails' own suite does not have (Ruby cannot reach it,
so it belongs in `error-reporter.trails.test.ts`, not the mirrored file):
`handle` must NOT swallow an `UnexpectedError` raised under `debugMode`.

## Acceptance criteria

- [ ] `handle`/`record` do not rescue `UnexpectedError`, matching
      `error_reporter.rb:29,33`.
- [ ] `unexpected` under `debugMode` surfaces out of an enclosing `handle`.
- [ ] The `UnexpectedError` JSDoc's deviation note in `error-reporter.ts` is
      removed, not reworded.
- [ ] Covered in `error-reporter.trails.test.ts` with the Rails cite.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
