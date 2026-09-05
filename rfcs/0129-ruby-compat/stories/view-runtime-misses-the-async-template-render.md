---
title: "view_runtime misses the template/partial render deferred to renderAsync"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: 7509
claim: "2026-09-05T03:42:13Z"
assignee: "fast-string-to-time-construct-through-time-new"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Instrumentation#render`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:28-34`)
wraps the WHOLE render in `cleanup_view_runtime` /
`ActiveSupport::Benchmark.realtime`, so every rendered byte is inside
`view_runtime`.

PR #7501 ported that wrap onto `Base#render`
(`packages/actionpack/src/action-controller/base.ts`), which is faithful for
every arm that renders synchronously — `json:`, `plain:`, `html:`, `body:`,
`text:`. It is NOT faithful for the template and partial arms: those set
`this._pendingRender` and `return` out of the measured closure, and the actual
rendering happens later in `renderAsync` (`base.ts`, awaited from
`processAction`). So a request that renders a template records a
`view_runtime` covering only the dispatch bookkeeping, and the
`Views: Nms` segment (`log_subscriber.rb:29-31`) under-reports by the entire
template render.

The split exists because trails' template resolution is async where Rails' is
synchronous; `_pendingRender` is the trails shape that defers it.
`Benchmark.realtime` (`activesupport/src/benchmark.ts`, ported in #7501) is
synchronous, mirroring `benchmark.rb:15-19`.

## Converged shape

`view_runtime` covers the template/partial render too — either by measuring
`renderAsync` and adding its elapsed time to the same `viewRuntime` field the
sync wrap assigns, or by an async counterpart of `Benchmark.realtime` if one
can be justified against `benchmark.rb`. The measurement must stay a single
`cleanup_view_runtime`-wrapped quantity, as `instrumentation.rb:30` has it, not
two independently-reported numbers.

## Acceptance criteria

- A request that renders a template reports a `view_runtime` that includes the
  template render, asserted by a test against the `process_action` payload.
- The sync arms keep the behaviour #7501 landed.
- `cleanup_view_runtime` still wraps the measurement, so an override (AR's
  `ControllerRuntime#cleanup_view_runtime`) can still subtract from it.
