---
title: "Converge OrderedOptions/InheritableOptions constructors and dup to Hash's shape"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6618
claim: "2026-08-16T23:19:58Z"
assignee: "converge-ordered-options-constructor-and-dup"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #6611 (`rebuild-ordered-options-on-a-hash-subclass`) and flagged by review as
carried debt predating that PR — the rebuild converged the member set and the parent
lookup but deliberately left the constructor shape alone to keep the diff scoped.

`activesupport/lib/active_support/ordered_options.rb:89-99`:

```ruby
class InheritableOptions < OrderedOptions
  def initialize(parent = nil)
    @parent = parent
    if @parent.kind_of?(OrderedOptions)
      super() { |h, k| @parent._get(k) }
    elsif @parent
      super() { |h, k| @parent[k] }
    else
      super()
      @parent = {}
    end
  end
```

Two deviations in `packages/activesupport/src/ordered-options.ts`:

1. `InheritableOptions` takes `(parent = null, initial = {})`. Rails takes **only**
   `parent`; entries are set afterwards through `[]=` / `method_missing`.
2. `OrderedOptions` takes `(initial = {})` at all. `OrderedOptions < Hash` and `Hash.new`
   takes a default _value_ or a block, never entries — `OrderedOptions.new({a: 1})` is not
   a thing in Rails.

A third, same-family: `dup()` (`OrderedOptions#dup`) hardcodes `new OrderedOptions(...)`,
so `InheritableOptions#dup` answers an `OrderedOptions` and silently drops the parent.
Ruby's `Object#dup` allocates the receiver's own class and copies its ivars, so an
`InheritableOptions` dup stays an `InheritableOptions` with the same `@parent`.

Both trails constructors are used widely in tests and in `Configurable` (`Configuration
extends InheritableOptions`), so converging them is a real, sized change rather than a
signature tweak.

## Converged shape

- `OrderedOptions` constructor takes no entries argument (Hash's own shape).
- `InheritableOptions` constructor takes `parent` only, installing the default block per
  :91-98 — including the `else` arm that sets `@parent = {}`.
- `dup()` allocates `this.constructor`, so an `InheritableOptions` dup keeps its class and
  parent.
- Call sites (`ordered-options.test.ts` in BOTH packages, `configurable.ts`, trailties
  config seeding) build through `set`/`method_missing` instead of the entries argument.

## Acceptance criteria

- [ ] Neither constructor takes an entries hash; both match ordered_options.rb:89-99 /
      `Hash.new`.
- [ ] `new InheritableOptions(parent).dup()` is an `InheritableOptions` and still reads
      through to `parent`.
- [ ] Both `OrderedOptionsTest` files keep their Rails test names and pass; `pnpm
parity:api:extra --package activesupport` does not grow for `ordered-options.ts`.
- [ ] `pnpm parity:api:calls` / `:args` green.
