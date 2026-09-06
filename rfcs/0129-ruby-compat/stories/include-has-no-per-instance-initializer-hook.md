---
title: "include-has-no-per-instance-initializer-hook"
status: in-progress
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7561
claim: "2026-09-06T15:38:14Z"
assignee: "include-has-no-per-instance-initializer-hook"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `include SomeModule` can carry per-instance state, because the module
can define `initialize` and `super` up the chain — that is exactly what
`ActiveRecord::Railties::ControllerRuntime#initialize`
(`activerecord/lib/active_record/railties/controller_runtime.rb:26-29`) and its
ActionController twin (`actionpack/lib/action_controller/metal/instrumentation.rb:23-26`)
do, each seating one `attr_internal` to `nil` on every instance.

trails' `include()` (`packages/ruby-compat/src/include.ts`) has no counterpart.
It copies methods onto `klass.prototype` and fires the `included` hook with the
class; nothing runs per instance, and a mixin therefore cannot install an own
property the way a class field does. `packages/actionpack/src/action-controller/metal.ts`
has no instance-initializer list a mixin could push onto either.

PR #7528 hit this porting `ControllerRuntime#initialize`. The seat there is
`proto.dbRuntime = null` in the `included` hook: reads answer `null` as Ruby's
do, but `dbRuntime` becomes an _own_ property only on the first write, so it is
invisible to `Object.keys` / spread / `JSON.stringify` until then. The test at
`packages/activerecord/src/trailties/controller-runtime.trails.test.ts` pins
both arms of that, deliberately, so the gap is measured rather than hidden.

The ActionController twin does not have the problem only because
`viewRuntime: number | null = null` is a class field in a class trails owns
(`packages/actionpack/src/action-controller/base.ts:221`). Adding a `dbRuntime`
field there is not the fix — it would put an ActiveRecord attribute in a class
Rails does not put it in.

## Converged shape

An instance-initializer hook in `ruby-compat`'s mixin machinery: a module can
register a function that runs against each new instance, so `included`-time
seating lands as an own property at construction. The natural Ruby anchor is
the module's own `initialize` + `super` chain
(`vendor/ruby/class.c:1179` `rb_include_module` splices the module into the
lookup chain, so `initialize` is found there), which is what the hook stands in
for. Whatever shape it takes must reach `ActionController::Base` instances,
since `active_record.log_runtime` (`activerecord/lib/active_record/railtie.rb:268`)
is where `ControllerRuntime` is mixed in.

## Acceptance criteria

- A module included with `include()` can seat per-instance state that is an own
  property of every instance at construction time.
- `ControllerRuntime`'s `dbRuntime` seat moves onto it, and the two
  `Object.hasOwn` assertions in `controller-runtime.trails.test.ts` flip to
  `true` before any write.
- The hook is anchored to Ruby's include semantics, not invented surface — or,
  if no honest anchor exists, it carries a `@noRailsEquivalent` receipt.
