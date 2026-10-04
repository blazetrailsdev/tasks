---
title: "activesupport: Callbacks is not an includable Concern, so include ActiveSupport::Callbacks is two calls at each of three sites"
status: closed
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps:
  - activesupport-callbacks-chains-are-not-the-callbacks-class-attribute
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8409
claim: "2026-10-02T16:41:58Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: "Delivered by trails#8409 (three includers are one call) + trails#8455 (Callbacks is a Module extended with Concern; included body ported). On origin/main: packages/activesupport/src/callbacks.ts:1154-1166 is 'new Module()' / 'extend(Callbacks, Concern)' / 'Concern.included.call(Callbacks, ...)' doing extend DescendantsTracker + classAttribute __callbacks; 'include(base, ASCallbacks)' at activemodel/src/callbacks.ts:24, validations/callbacks.ts:62 and 'include(Engine, ASCallbacks)' at trailties/src/engine.ts:417; git grep 'ASCallbacks.InstanceMethods' finds nothing. The blocker dep activesupport-callbacks-chains-are-not-the-callbacks-class-attribute is done (trails#8440)."
---

## Context

`ActiveSupport::Callbacks` is a Concern (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:64-70`):

```ruby
module Callbacks
  extend Concern

  included do
    extend ActiveSupport::DescendantsTracker
    class_attribute :__callbacks, instance_writer: false, instance_predicate: false, default: {}
  end
```

so every Rails includer is one line, `include ActiveSupport::Callbacks`:

- `ActiveModel::Callbacks.extended` — `vendor/rails/v8.0.2/activemodel/lib/active_model/callbacks.rb:66-70`
- `ActiveModel::Validations::Callbacks` `included do` — `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/callbacks.rb:26`
- `Rails::Engine` — `vendor/rails/v8.0.2/railties/lib/rails/engine.rb:434`

In trails `Callbacks` is a TS `namespace` (`packages/activesupport/src/callbacks.ts:1043`), not a
module `include()` accepts, so each includer spells the one Rails line as two calls on the
Concern's halves:

- `packages/activemodel/src/callbacks.ts:22-25` — `include(base, ASCallbacks.InstanceMethods); extend(base, ASCallbacks.ClassMethods);`
- `packages/activemodel/src/validations/callbacks.ts:62`
- `packages/trailties/src/engine.ts:368-369`

Nothing fires the Concern's own `included do` block from an `include`, so the
`extend ActiveSupport::DescendantsTracker` and `class_attribute :__callbacks` it performs are
carried elsewhere or not at all per includer.

Found by `activemodel-lifecycle-hook-semantics-audit` (trails#8314), whose PR body said this shape
was tracked under RFC 0115; the two stories there
(`install-activesupport-callbacks-from-the-callbacks-extended-hook`,
`converge-activemodel-callbacks-extended-hook-to-append-features-order`) are done and left the
two-call spelling in place.

## Acceptance criteria

- [ ] `ActiveSupport::Callbacks` is a module `include()` accepts, with its `ClassMethods` mixed in
      by the Concern mechanism and its `included do` body (`callbacks.rb:67-70`) ported as the
      symbol-keyed `included` callback.
- [ ] The three includers above each read `include(base, Callbacks)`, one call, as Rails does.
- [ ] `pnpm parity:api:calls` stays green and no new `@noRailsEquivalent` is added for the split halves.
