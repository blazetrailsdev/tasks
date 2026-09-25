---
title: "define_callbacks: reset per descendant, generate _run_name_callbacks, shallow set_callbacks"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8087, which ported the class-level `_#{name}_callbacks` reader/writer plus `get_callbacks`/`set_callbacks` so `reset_callbacks` (`activerecord/test/cases/test_case.rb:179-191`) could snapshot and restore chains the way Rails does.

`ActiveSupport::Callbacks::ClassMethods#define_callbacks` (`activesupport/lib/active_support/callbacks.rb:900-930`) still diverges from `Callbacks.defineCallbacks` in `packages/activesupport/src/callbacks.ts` in three ways:

1. Rails calls `target.set_callbacks name, CallbackChain.new(name, options)` for `[self] + self.descendants` on every call (`:905-907`), so redefining a chain resets it on the class and every subclass. trails creates a chain only when the name is absent (`if (!chains.has(name))`) and never touches descendants.
2. The `module_eval` also generates `_run_#{name}_callbacks(&block)` and the instance reader `_#{name}_callbacks` (`__callbacks[name]`), `:910-913` and `:923-925`. trails ports only the class reader/writer pair.
3. `set_callbacks` (`:935-944`) shallow-dups the `__callbacks` Hash, so a subclass shares its parent's chain objects until it writes one. trails' `getCallbackChains` deep-copies every chain (`chain.dup()`) the first time a prototype is touched.

## Acceptance criteria

- `defineCallbacks` resets the chain on the class and every descendant, as `callbacks.rb:905-907` does.
- `_run_${name}Callbacks` and the instance `_${name}Callbacks` reader are generated beside the class accessor pair.
- Copy-on-write in `getCallbackChains` / `setCallbacks` matches `set_callbacks`' shallow `__callbacks.dup`, or the story is blocked with the concrete test that breaks.
- `callbacks.test.ts` in activesupport, activemodel and activerecord stays green.
