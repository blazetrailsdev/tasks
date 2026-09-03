---
title: "instrumentation-render-view-runtime-wiring"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
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

`ActionController::Instrumentation#render`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:28-33`)
is not ported:

```ruby
def render(*)
  render_output = nil
  self.view_runtime = cleanup_view_runtime do
    ActiveSupport::Benchmark.realtime(:float_millisecond) { render_output = super }
  end
  render_output
end
```

Three things are missing as a set:

- `Base#render` (`packages/actionpack/src/action-controller/base.ts:303`, a
  67-line concrete method) does not wrap its body in `cleanup_view_runtime`,
  so nothing ever calls the hook.
- `attr_internal :view_runtime` (`instrumentation.rb:21`) has no port, so
  `this.viewRuntime` is not a declared member of `Base` at all.
- `ActiveSupport::Benchmark.realtime(:float_millisecond)` has no counterpart
  in `@blazetrails/activesupport`.

The consequence is that `appendInfoToPayload`'s
`if (this.viewRuntime !== undefined)` guard
(`action-controller/metal/instrumentation.ts:116`, the port of
`instrumentation.rb:108-110`) can never fire, so `view_runtime` never reaches
the `process_action.action_controller` payload the way it does in Rails — and
`LogSubscriber#process_action`'s `Views: Nms` segment
(`log_subscriber.rb:29-31`, via `log_process_action`) is correspondingly never
emitted.

Surfaced by blazetrailsdev/trails#7441, which ported
`Instrumentation#process_action` and mixed `append_info_to_payload` /
`halted_callback_hook` onto `Base.prototype`. That PR deliberately did NOT
assign `cleanup_view_runtime` there: the assignment made the
`render` -> `cleanup_view_runtime` row in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/base.json` go
STALE without the call existing, because the call-set extractor reads the
file's call set and the bare prototype assignment put the name in the file. A
false green on a real omission is worse than the baselined row, so the
assignment was dropped and the row kept with this story's id as its reason.

Wrapping the 67-line body is a ~130-line reindent diff, which is why it was
not folded into #7441.

## Acceptance criteria

- `view_runtime` is a declared member of `Base` (the port of
  `attr_internal :view_runtime`, `instrumentation.rb:21`), initialized to null
  as `Instrumentation#initialize` does (`instrumentation.rb:23-26`).
- `Base#render` wraps its body in `cleanupViewRuntime` and assigns the elapsed
  time to `viewRuntime`, mirroring `instrumentation.rb:28-33`, with a
  `Benchmark.realtime` counterpart in `@blazetrails/activesupport` rather than
  an ad-hoc `performance.now()` pair.
- `appendInfoToPayload` puts `view_runtime` on the `process_action` payload for
  a request that rendered, and `LogSubscriber` emits the `Views:` segment.
- The `render` -> `cleanup_view_runtime` row is deleted from
  `call-mismatches-exclude/actioncontroller/base.json` (only-shrink) and the
  per-file mark tightened with `pnpm parity:api:calls:tighten`.
- A test asserts `view_runtime` reaches the payload — not merely that the hook
  is callable.
