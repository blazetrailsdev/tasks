---
title: "route-set-draw-clears-and-finalizes-unconditionally"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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

`RouteSet#draw` (`packages/actionpack/src/action-dispatch/routing/route-set.ts:943-948`)
only runs `clearBang()` / `finalizeBang()` when a `prepend` or `append` block is
registered (`const railsSemantics = this._prepend.length > 0 || this._append.length > 0`).
Rails runs both unconditionally, gated only by `@disable_clear_and_finalize`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:459-465`):

```ruby
def draw(&block)
  clear! unless @disable_clear_and_finalize
  eval_block(block)
  finalize! unless @disable_clear_and_finalize
  nil
end
```

The guard was added in #2129 (commit 5c3c4fd553) so that call sites that drew a
route set several times and relied on the draws accumulating would keep their
routes. That accumulation is the deviation. In Rails a second `draw` replaces the
first, and callers that want accumulation set `disable_clear_and_finalize = true`
(as `Rails::Application::RoutesReloader` does) or use `append` / `prepend`.

Reviewer on trails#8304 flagged it as pre-existing and out of scope.

## Acceptance criteria

- `RouteSet#draw` is line-for-line `route_set.rb:459-465`: `clearBang()` unless
  `disableClearAndFinalize`, `evalBlock(block)`, `finalizeBang()` unless
  `disableClearAndFinalize`. The `railsSemantics` local is gone.
- The parameter is named `block`, as in Rails.
- Every caller that relied on draws accumulating is converged: it sets
  `disableClearAndFinalize` the way Rails' caller does, or it draws once.
  No such caller is left in actionpack, actionview, trailties or website tests.
- The route-set test that pins the behaviour, if Rails has one, is ported. If
  Rails has none, a `.trails.test.ts` case shows that a second `draw` drops the
  first draw's routes. That case fails on the baseline.
