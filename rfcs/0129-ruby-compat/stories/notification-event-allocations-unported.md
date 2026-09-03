---
title: "Port Notifications::Event#allocations and now_allocations beside gc_time"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Notifications::Event` carries four measurement pairs
(`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:110-232`):
cpu time, gc time, allocations, and wall duration. PR #7437 ported `gc_time`
(`:182-184`) and its `now_gc` (`:218-225`) because
`ActionController::LogSubscriber#process_action` needs it. **`allocations` is
still unported:**

```ruby
# instrumenter.rb:176-180
def allocations
  @allocation_count_finish - @allocation_count_start
end
```

with `@allocation_count_start` / `@allocation_count_finish` set in `start!`
(`:150`) and `finish!` (`:158`), initialized at `:118-119`, and read through
`now_allocations` (`:226-232`), which — exactly like `now_cpu` and `now_gc` —
has a working arm and a `0` fallback arm:

```ruby
if GC.stat.key?(:total_allocated_objects)
  def now_allocations
    GC.stat(:total_allocated_objects)
  end
else
  def now_allocations
    0
  end
end
```

`packages/activesupport/src/notifications/instrumenter.ts` has neither the two
ivars nor either method. JS exposes no allocation counter, so this is Rails'
own fallback arm — the same genuine language shortcoming already ratified in
`nowCpu` and `nowGc` — not a stub.

## Converged shape

`_allocationCountStart` / `_allocationCountFinish` initialized to `0`, stamped
in `startBang` / `finishBang` beside the cpu and gc pairs and in Rails' order,
an `allocations` getter, and a private `nowAllocations` returning `0` with the
`instrumenter.rb:226-232` citation the sibling fallbacks carry.

## Acceptance criteria

- `Event#allocations` exists and answers `0`, with `nowAllocations` citing
  Rails' own fallback arm.
- The two ivars are stamped in `startBang` / `finishBang` in Rails' order.
- `pnpm parity:api` for activesupport is non-negative; activesupport green.
