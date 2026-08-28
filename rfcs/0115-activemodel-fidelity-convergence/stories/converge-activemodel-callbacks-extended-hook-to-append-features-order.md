---
title: "Converge ActiveModel::Callbacks' extended hook to append_features order"
status: in-progress
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7168
claim: "2026-08-28T16:04:58Z"
assignee: "converge-activemodel-callbacks-extended-hook-to-append-features-order"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Callbacks.extended` installs ActiveSupport::Callbacks with one
statement:

```ruby
# activemodel/lib/active_model/callbacks.rb:66-70
def self.extended(base) # :nodoc:
  base.class_eval do
    include ActiveSupport::Callbacks
  end
end
```

`ActiveSupport::Callbacks` is itself `extend Concern`
(`activesupport/lib/active_support/callbacks.rb:65`), so that single `include`
recurses into `append_features` and lands its halves in `concern.rb:136-137`
order: the module's own instance methods first (`:136`, via `super`), then
`base.extend const_get(:ClassMethods)` (`:137`).

`packages/activemodel/src/callbacks.ts:22-25` spells the two halves in the
opposite order:

```ts
static [extended](base: AnyClass): void {
  extend(base, ASCallbacks.ClassMethods);
  include(base, ASCallbacks.InstanceMethods);
}
```

This is the same inversion PR #7160 fixed in
`packages/activemodel/src/validations/callbacks.ts` for the identical nested
`include ActiveSupport::Callbacks` at `validations/callbacks.rb:25`. The
inverted spelling is written into the (already `done`) story
`install-activesupport-callbacks-from-the-callbacks-extended-hook`'s "Converged
shape" block, which is why it was carried in verbatim — a ratified deviation is
debt, not permission, so it converges here rather than being left to match.

Harmless today only because nothing in `ASCallbacks.InstanceMethods` reads a
`ClassMethods` member during the include; the ordering is load-bearing the
moment one does.

## Converged shape

`Callbacks.[extended]` issues the instance half before the class half, matching
`concern.rb:136-137`:

```ts
static [extended](base: AnyClass): void {
  include(base, ASCallbacks.InstanceMethods);   // :136
  extend(base, ASCallbacks.ClassMethods);       // :137
}
```

While there, check the other `ASCallbacks` include/extend pairs in activemodel
for the same inversion and converge them in the same PR if they are in the same
file.

## Acceptance criteria

- `packages/activemodel/src/callbacks.ts`'s `[extended]` hook runs
  `include(InstanceMethods)` before `extend(ClassMethods)`.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; parity deltas non-negative.

## Verification

```bash
pnpm vitest run packages/activemodel/src/callbacks.test.ts packages/activemodel/src/validations.test.ts packages/activemodel/src/validations/callbacks.trails.test.ts
```
