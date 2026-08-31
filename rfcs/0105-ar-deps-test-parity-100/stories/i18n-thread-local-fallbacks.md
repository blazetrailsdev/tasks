---
title: "Give I18n.fallbacks per-execution-context storage so the multi-threaded fallbacks test can port"
status: draft
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
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

`i18n/test/backend/fallbacks_test.rb:121-135` — `test "multi-threaded fallbacks"` —
is the one i18n test PR (port-i18n-remaining-cases) could not port. It asserts
that `I18n.fallbacks = [:de]` performed inside another thread is invisible to
the thread that set `[:en]`:

```ruby
I18n.fallbacks = [:en]
thread = Thread.new { I18n.fallbacks = [:de] }
thread.join
assert_equal 'Bar in :en', I18n.t(:bar, locale: :'pt-BR')
```

That holds because `fallbacks=` writes BOTH the class variable and
`Thread.current[:i18n_fallbacks]`, and `fallbacks` reads the thread-local over
the top of it (`i18n/lib/i18n/backend/fallbacks.rb:13-27`).

trails' `packages/i18n/src/backend/fallbacks.ts:38-57` is a single module-level
binding — `fallbacksStore` — with the deviation documented at the declaration
and again in the header of `packages/i18n/src/backend/fallbacks.test.ts`.
Giving it per-execution-context storage needs an execution-state facility
`@blazetrails/i18n` does not have: `IsolatedExecutionState` /
`withExecutionContext` live in `@blazetrails/activesupport`, which already
depends on `@blazetrails/i18n` (`packages/activesupport/package.json:130`), so
importing it back is a package cycle. `@blazetrails/ruby-compat` — i18n's only
other dependency — has no execution-state surface today.

Deciding where that facility lives (ruby-compat? a new leaf package? i18n's
own?) is the work; it is not a mechanical port.

## Acceptance criteria

- `I18n.fallbacks` / `setFallbacks` read and write per-execution-context
  storage the way `fallbacks.rb:13-27` reads `Thread.current[:i18n_fallbacks]`
  over `@@fallbacks`, with no package cycle.
- `test "multi-threaded fallbacks"` is ported verbatim into
  `packages/i18n/src/backend/fallbacks.test.ts` and passes; the header note
  naming it as unported is deleted.
- `pnpm parity:test --package i18n` shows `backend/fallbacks_test.rb` at 46/46.
