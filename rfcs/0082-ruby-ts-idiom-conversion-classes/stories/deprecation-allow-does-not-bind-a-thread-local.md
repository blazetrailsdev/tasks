---
title: "deprecation-allow-does-not-bind-a-thread-local"
status: draft
updated: 2026-09-02
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

`Deprecation#allow` scopes its allow-list through a `Concurrent::ThreadLocalVar`:
`@explicitly_allowed_warnings = Concurrent::ThreadLocalVar.new(nil)`
(`activesupport/lib/active_support/deprecation.rb:78`) and
`@explicitly_allowed_warnings.bind(allowed_warnings, &block)`
(`activesupport/lib/active_support/deprecation/reporting.rb:93`).

`packages/activesupport/src/deprecation.ts`'s `allow` saves the field, assigns,
runs the block and restores in a `finally` instead. Two consequences:

1. **It is not execution-context scoped.** `ThreadLocalVar#bind` binds for the
   current thread only, so a concurrent logical task never sees another's
   allow-list. The plain-field save/restore is process-global, so an `await`
   inside the block leaks the allow-list to anything else running in that window
   — `deprecator.allow` around an async body silences unrelated warnings.
2. `parity:api:calls` flags it: the TS body omits the `bind` call the Ruby body
   makes. Surfaced in PR #7386 once `API_COMPARE_FORCE=1` cleared the extractor
   cache; that PR deliberately did NOT baseline it (reviewer feedback: unrelated
   suppression debt in a fold PR), so the row is live.

The reader half is `@explicitly_allowed_warnings.value` (`reporting.rb:120` via
`deprecation_allowed?`), which the port reads straight off the field.

## Converged shape

trails already has the execution-context seam `ThreadLocalVar` needs:
`IsolatedExecutionState` (`packages/activesupport/src/isolated-execution-state.ts`),
which `CurrentAttributes` uses for exactly this per-logical-task shape
(`current-attributes.ts:230`). Port `ThreadLocalVar` with `value` / `bind` over
it and have `allow` call `bind`, so the body is
`this._explicitlyAllowedWarnings.bind(allowedWarnings, block)` line-for-line.

Note `IsolatedExecutionState.run` is NOT the analogue of `Thread.new` here —
`withExecutionContext` is (see the repo's notes on that distinction); `bind` wants
a scoped set-and-restore _within_ the current context, which is what
`CurrentAttributes` models.

## Acceptance criteria

- [ ] `ThreadLocalVar` ported with `value` and `bind`, backed by
      `IsolatedExecutionState`.
- [ ] `Deprecation#allow` calls `bind` and its body matches `reporting.rb:89-97`.
- [ ] A regression test: two concurrent logical tasks, one inside
      `deprecator.allow`, and the other still warns. It must fail on the current
      save/restore implementation.
- [ ] `pnpm parity:api:calls` no longer reports
      `activesupport deprecation.ts allow bind`, with no baseline row added.
