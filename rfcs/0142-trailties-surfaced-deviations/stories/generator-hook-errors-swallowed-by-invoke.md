---
title: "An error in a hook generator is swallowed instead of propagating out of Generators.invoke"
status: draft
updated: 2026-11-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while wiring `trails generate` into the playground (trails#10808). Running `generate model Tag name:string` where the inner `active-record:model` generator failed (its `.tt.js` template could not be imported) printed only `invoke  active_record` and returned normally, writing nothing. Invoking `active-record:model` directly surfaced the `TypeError`. So an error raised inside a hook invoked through `hookFor` / `invokeFromOption` (`packages/trailties/lib/generators/base.ts:340-360`) is lost somewhere between the hook and `Generators.invoke` (`packages/trailties/lib/generators.ts:227-245`).

Rails: `prepare_for_invocation` / `invoke_from_option` (`vendor/rails/v8.0.5.2/railties/lib/rails/generators/base.rb:280-300`) call Thor's `invoke` (`vendor/thor/v1.4.0/lib/thor/invocation.rb:102-117`), which does not rescue: the hook's exception propagates out of `Generators.invoke`.

## Acceptance criteria

- Find where the rejection is dropped (an unawaited promise in the hook's generated method or in `invoke_with_padding` is the likely site).
- An error raised in an invoked hook propagates out of `Generators.invoke`, as in Rails.
- A trailties test that fails on main: a hook generator whose step throws makes `Generators.invoke` of the parent reject.
